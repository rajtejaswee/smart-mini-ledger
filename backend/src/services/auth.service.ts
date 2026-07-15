import type { User } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../middlewares/errorHandler";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import type {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "../validators/auth.schema";

// Never leak the password hash to the client.
function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    monthlyIncome: user.monthlyIncome,
    emailAlerts: user.emailAlerts,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  return { user: toPublicUser(user), token: signToken(user.id) };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Same generic message whether the email or password is wrong (no account enumeration).
  if (!user || !(await comparePassword(input.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  return { user: toPublicUser(user), token: signToken(user.id) };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  return toPublicUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  // Only apply the keys the client actually sent, so omitting one never wipes it.
  const data: { name?: string; monthlyIncome?: number | null; emailAlerts?: boolean } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.monthlyIncome !== undefined) data.monthlyIncome = input.monthlyIncome;
  if (input.emailAlerts !== undefined) data.emailAlerts = input.emailAlerts;

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "Nothing to update");
  }

  const user = await prisma.user.update({ where: { id: userId }, data });
  return toPublicUser(user);
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  if (!(await comparePassword(input.currentPassword, user.passwordHash))) {
    throw new ApiError(401, "Current password is incorrect", undefined, "INVALID_PASSWORD");
  }
  if (await comparePassword(input.newPassword, user.passwordHash)) {
    throw new ApiError(400, "New password must be different from the current one");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });
}
