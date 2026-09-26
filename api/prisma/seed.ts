import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const skillNames = ["React", "TypeScript", "Node.js", "Express", "UI/UX Design", "Figma", "React Native", "Expo", "Prisma", "SQLite", "Content Writing", "SEO", "Illustration", "Digital Marketing", "Project Management", "QA Testing", "Python", "Data Analysis"];
const firstNames = ["Aung", "Thiri", "Min", "Su", "Htet", "Ei", "Nandar", "Ko", "May", "Zaw", "Mya", "Lin", "Khin", "Pyae", "Wai", "Nyein", "Thet", "Hla"];
const categories = ["Web Development", "Mobile Development", "Design", "Writing", "Marketing", "Data & Analytics"];
const jobTitles = ["Build a responsive portfolio website", "Design a mobile app onboarding flow", "Create an analytics dashboard", "Improve our product landing page", "Develop a React Native companion app", "Write SEO content for a new product", "Set up an email marketing campaign", "Create a brand identity starter kit"];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

async function main() {
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.job.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();

  const skills = [];
  for (const name of skillNames) {
    skills.push(await prisma.skill.create({ data: { name, slug: slug(name) } }));
  }

  const passwordHash = await bcrypt.hash("ArcherDemo123!", 10);
  const clients = [];
  const freelancers = [];
  for (let index = 0; index < 36; index += 1) {
    const isClient = index < 12;
    const displayName = `${firstNames[index % firstNames.length]} ${isClient ? "Studio" : "Works"}`;
    const user = await prisma.user.create({
      data: {
        email: `${isClient ? "client" : "freelancer"}${index + 1}@archer.demo`,
        passwordHash,
        displayName,
        role: isClient ? "CLIENT" : "FREELANCER",
        defaultCurrency: index % 3 === 0 ? "MMK" : "USD",
        headline: isClient ? null : `${categories[index % categories.length]} specialist`,
        bio: isClient ? `A growing business looking for dependable creative partners.` : `Experienced freelancer helping clients ship thoughtful, high-quality work.`,
        location: index % 2 === 0 ? "Yangon, Myanmar" : "Mandalay, Myanmar",
        hourlyRateMinor: isClient ? null : (index % 3 === 0 ? 25000 + index * 500 : 2500 + index * 100),
        ratingAverage: isClient ? 0 : 4 + (index % 10) / 10,
        ratingCount: isClient ? 0 : 3 + index,
        availability: index % 5 === 0 ? "LIMITED" : "AVAILABLE"
      }
    });
    if (isClient) clients.push(user); else freelancers.push(user);
  }

  for (const [index, freelancer] of freelancers.entries()) {
    const selectedSkills = [skills[index % skills.length], skills[(index + 2) % skills.length], skills[(index + 5) % skills.length]];
    await prisma.userSkill.createMany({ data: selectedSkills.map((skill) => ({ userId: freelancer.id, skillId: skill.id, proficiency: index % 2 ? "ADVANCED" : "INTERMEDIATE" })) });
    await prisma.portfolioItem.createMany({ data: [1, 2].map((item) => ({ userId: freelancer.id, title: `${selectedSkills[item - 1].name} sample project`, description: "A seeded portfolio project for development and demos.", projectUrl: "https://example.com/portfolio", sortOrder: item })) });
  }

  const jobs = [];
  for (let index = 0; index < 48; index += 1) {
    const currency = index % 4 === 0 ? "MMK" : "USD";
    const min = currency === "MMK" ? 500000 + (index % 6) * 100000 : 50000 + (index % 6) * 10000;
    const status = index < 24 ? "OPEN" : index < 40 ? "HIRED" : index < 44 ? "CLOSED" : "DRAFT";
    const job = await prisma.job.create({
      data: {
        clientId: clients[index % clients.length].id,
        title: jobTitles[index % jobTitles.length],
        description: `We need a reliable freelancer to help us deliver ${jobTitles[index % jobTitles.length].toLowerCase()}. Please share relevant work and your suggested approach.`,
        category: categories[index % categories.length],
        budgetMinMinor: min,
        budgetMaxMinor: min * 2,
        currency,
        budgetType: index % 5 === 0 ? "HOURLY" : "FIXED",
        experienceLevel: index % 3 === 0 ? "EXPERT" : index % 3 === 1 ? "ENTRY" : "INTERMEDIATE",
        locationMode: index % 5 === 0 ? "HYBRID" : "REMOTE",
        status,
        skills: { create: [skills[index % skills.length], skills[(index + 3) % skills.length]].map((skill) => ({ skillId: skill.id })) }
      }
    });
    jobs.push(job);
  }

  const proposals = [];
  for (let index = 0; index < 72; index += 1) {
    const job = jobs[index % jobs.length];
    if (job.status === "DRAFT") continue;
    const freelancer = freelancers[(index * 7 + Math.floor(index / jobs.length)) % freelancers.length];
    const proposal = await prisma.proposal.create({
      data: {
        jobId: job.id,
        freelancerId: freelancer.id,
        coverLetter: `I have relevant experience for ${job.title.toLowerCase()} and can provide a clear delivery plan with regular updates.`,
        proposedAmountMinor: job.budgetMinMinor + (index % 3) * Math.floor((job.budgetMaxMinor - job.budgetMinMinor) / 3),
        currency: job.currency,
        estimatedDays: 5 + (index % 20),
        status: job.status === "HIRED" && index < jobs.length ? "ACCEPTED" : index % 7 === 0 ? "REJECTED" : "SUBMITTED"
      }
    });
    proposals.push(proposal);
  }

  const accepted = proposals.filter((proposal) => proposal.status === "ACCEPTED").slice(0, 16);
  for (const proposal of accepted) {
    const job = jobs.find((candidate) => candidate.id === proposal.jobId)!;
    await prisma.contract.create({
      data: {
        jobId: job.id,
        proposalId: proposal.id,
        clientId: job.clientId,
        freelancerId: proposal.freelancerId,
        title: job.title,
        description: job.description,
        agreedAmountMinor: proposal.proposedAmountMinor,
        currency: proposal.currency,
        status: proposal.id.charCodeAt(0) % 2 ? "ACTIVE" : "COMPLETED"
      }
    });
  }

  const contracts = await prisma.contract.findMany();
  for (const contract of contracts) {
    const conversation = await prisma.conversation.create({ data: { jobId: contract.jobId, contractId: contract.id, clientId: contract.clientId, freelancerId: contract.freelancerId } });
    await prisma.message.createMany({ data: [
      { conversationId: conversation.id, senderId: contract.clientId, body: "Thanks for your proposal. Looking forward to working together." },
      { conversationId: conversation.id, senderId: contract.freelancerId, body: "Thank you. I will share the first update shortly." }
    ] });
  }

  for (const user of [...clients, ...freelancers]) {
    await prisma.notification.create({ data: { userId: user.id, type: "WELCOME", title: "Welcome to Archer", body: "Complete your profile to get better freelance matches." } });
  }

  console.log(`Seeded ${clients.length + freelancers.length} users, ${jobs.length} jobs, ${proposals.length} proposals, and ${contracts.length} contracts.`);
  console.log("Demo password for all seeded users: ArcherDemo123!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
