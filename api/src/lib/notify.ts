import { prisma } from "./prisma.js";

export async function notify(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  targetType?: string;
  targetId?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      targetType: input.targetType,
      targetId: input.targetId
    }
  });
}
