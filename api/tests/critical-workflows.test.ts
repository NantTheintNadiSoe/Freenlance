import request from "supertest";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

type Session = {
  user: { id: string; email: string; role: string };
  accessToken: string;
  refreshToken: string;
};

const password = "CriticalFlow123!";
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createdUserIds: string[] = [];
let client: Session;
let freelancer: Session;
let secondFreelancer: Session;
let outsider: Session;
let jobId: string;
let freelancerProposalId: string;
let secondProposalId: string;
let contractId: string;
let conversationId: string;

async function register(email: string, role: "CLIENT" | "FREELANCER") {
  const response = await request(app).post("/api/v1/auth/register").send({
    email,
    password,
    displayName: `${role} Test User`,
    role,
    defaultCurrency: "USD"
  });

  expect(response.status).toBe(201);
  createdUserIds.push(response.body.data.user.id);
  return response.body.data as Session;
}

function auth(session: Session) {
  return { Authorization: `Bearer ${session.accessToken}` };
}

const proposalBody = (currency: "USD" | "MMK" = "USD") => ({
  coverLetter: "I have relevant experience and can provide a clear delivery plan with regular updates.",
  proposedAmountMinor: currency === "USD" ? 85000 : 850000,
  currency,
  estimatedDays: 14
});

describe("critical API workflows", () => {
  beforeAll(async () => {
    client = await register(`critical-client-${suffix}@example.test`, "CLIENT");
    freelancer = await register(`critical-freelancer-${suffix}@example.test`, "FREELANCER");
    secondFreelancer = await register(`critical-freelancer-2-${suffix}@example.test`, "FREELANCER");
    outsider = await register(`critical-outsider-${suffix}@example.test`, "FREELANCER");
  });

  afterAll(async () => {
    if (conversationId) await prisma.message.deleteMany({ where: { conversationId } });
    if (conversationId) await prisma.conversation.deleteMany({ where: { id: conversationId } });
    if (contractId) await prisma.review.deleteMany({ where: { contractId } });
    if (contractId) await prisma.contract.deleteMany({ where: { id: contractId } });
    if (jobId) {
      await prisma.proposal.deleteMany({ where: { jobId } });
      await prisma.job.deleteMany({ where: { id: jobId } });
    }
    await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("rotates refresh tokens and rejects the previous token", async () => {
    const refreshed = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: client.refreshToken });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.refreshToken).not.toBe(client.refreshToken);

    const replay = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: client.refreshToken });

    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    client = { ...client, ...refreshed.body.data };
  });

  it("rejects malformed job money and unsupported proposal currency", async () => {
    const malformedJob = await request(app)
      .post("/api/v1/jobs")
      .set(auth(client))
      .send({
        title: "Invalid money job",
        description: "This description is long enough to pass the minimum validation requirement.",
        category: "Web Development",
        budgetMinMinor: -1,
        budgetMaxMinor: 100,
        currency: "USD",
        status: "OPEN"
      });

    expect(malformedJob.status).toBe(400);
    expect(malformedJob.body.error.code).toBe("VALIDATION_ERROR");

    const created = await request(app)
      .post("/api/v1/jobs")
      .set(auth(client))
      .send({
        title: "Critical workflow integration job",
        description: "This job is used to verify authorization, currency, hiring, contracts, and reviews.",
        category: "Web Development",
        budgetMinMinor: 50000,
        budgetMaxMinor: 100000,
        currency: "USD",
        status: "OPEN"
      });

    expect(created.status).toBe(201);
    jobId = created.body.data.id;

    const mismatch = await request(app)
      .post(`/api/v1/proposals/jobs/${jobId}`)
      .set(auth(freelancer))
      .send(proposalBody("MMK"));

    expect(mismatch.status).toBe(400);
    expect(mismatch.body.error.code).toBe("CURRENCY_MISMATCH");
  });

  it("enforces job ownership and role boundaries", async () => {
    const nonOwner = await request(app)
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set(auth(outsider))
      .send({ status: "PAUSED" });

    expect(nonOwner.status).toBe(403);
    expect(nonOwner.body.error.code).toBe("FORBIDDEN");

    const freelancerJob = await request(app)
      .post("/api/v1/jobs")
      .set(auth(freelancer))
      .send({
        title: "Freelancer cannot create jobs",
        description: "This request should be rejected before the job payload is persisted.",
        category: "Writing",
        budgetMinMinor: 100,
        budgetMaxMinor: 200,
        currency: "USD"
      });

    expect(freelancerJob.status).toBe(403);
    expect(freelancerJob.body.error.code).toBe("FORBIDDEN");
  });

  it("supports proposal submission and prevents duplicate active proposals", async () => {
    const first = await request(app)
      .post(`/api/v1/proposals/jobs/${jobId}`)
      .set(auth(freelancer))
      .send(proposalBody());
    expect(first.status).toBe(201);
    freelancerProposalId = first.body.data.id;

    const duplicate = await request(app)
      .post(`/api/v1/proposals/jobs/${jobId}`)
      .set(auth(freelancer))
      .send(proposalBody());
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("PROPOSAL_EXISTS");

    const second = await request(app)
      .post(`/api/v1/proposals/jobs/${jobId}`)
      .set(auth(secondFreelancer))
      .send(proposalBody());
    expect(second.status).toBe(201);
    secondProposalId = second.body.data.id;
  });

  it("accepts one proposal, rejects competitors, and creates one contract", async () => {
    const accepted = await request(app)
      .post(`/api/v1/proposals/${freelancerProposalId}/accept`)
      .set(auth(client));

    expect(accepted.status).toBe(201);
    contractId = accepted.body.data.id;
    expect(accepted.body.data.status).toBe("PENDING");
    expect(accepted.body.data.currency).toBe("USD");

    const job = await request(app).get(`/api/v1/jobs/${jobId}`);
    expect(job.body.data.status).toBe("HIRED");

    const competingProposal = await request(app)
      .get(`/api/v1/proposals/${secondProposalId}`)
      .set(auth(client));
    expect(competingProposal.status).toBe(200);
    expect(competingProposal.body.data.status).toBe("REJECTED");

    const contract = await request(app)
      .get(`/api/v1/contracts/${contractId}`)
      .set(auth(freelancer));
    expect(contract.status).toBe(200);
    conversationId = contract.body.data.conversations[0].id;
  });

  it("restricts contract and conversation access to participants", async () => {
    const contract = await request(app)
      .get(`/api/v1/contracts/${contractId}`)
      .set(auth(outsider));
    expect(contract.status).toBe(404);

    const conversation = await request(app)
      .get(`/api/v1/conversations/${conversationId}`)
      .set(auth(outsider));
    expect(conversation.status).toBe(404);

    const message = await request(app)
      .post(`/api/v1/conversations/${conversationId}/messages`)
      .set(auth(freelancer))
      .send({ body: "The first implementation update is ready for review." });
    expect(message.status).toBe(201);

    const history = await request(app)
      .get(`/api/v1/conversations/${conversationId}`)
      .set(auth(client));
    expect(history.status).toBe(200);
    expect(history.body.data.messages.some((item: { body: string }) => item.body.includes("first implementation"))).toBe(true);
  });

  it("enforces contract transitions and permits reviews only after completion", async () => {
    const prematureReview = await request(app)
      .post(`/api/v1/reviews/contracts/${contractId}`)
      .set(auth(client))
      .send({ rating: 5, title: "Great", comment: "This review is too early." });
    expect(prematureReview.status).toBe(404);

    const active = await request(app)
      .patch(`/api/v1/contracts/${contractId}/status`)
      .set(auth(client))
      .send({ status: "ACTIVE" });
    expect(active.status).toBe(200);

    const completed = await request(app)
      .patch(`/api/v1/contracts/${contractId}/status`)
      .set(auth(freelancer))
      .send({ status: "COMPLETED" });
    expect(completed.status).toBe(200);

    const job = await request(app).get(`/api/v1/jobs/${jobId}`);
    expect(job.body.data.status).toBe("CLOSED");

    const review = await request(app)
      .post(`/api/v1/reviews/contracts/${contractId}`)
      .set(auth(client))
      .send({ rating: 5, title: "Great collaboration", comment: "Clear communication and excellent delivery." });
    expect(review.status).toBe(201);
    expect(review.body.data.recipientId).toBe(freelancer.user.id);

    const invalidTransition = await request(app)
      .patch(`/api/v1/contracts/${contractId}/status`)
      .set(auth(client))
      .send({ status: "ACTIVE" });
    expect(invalidTransition.status).toBe(409);
    expect(invalidTransition.body.error.code).toBe("INVALID_STATE");
  });
});
