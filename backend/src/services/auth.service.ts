import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

type Role = 'USER' | 'ADMIN';

type RegisterUserInput = {
	email: string;
	password: string;
	name: string;
	username: string;
};

type LoginUserInput = {
	email: string;
	password: string;
	username: string;
};

export type UserProfile = {
	id: string;
	name: string;
	email: string;
	username: string;
	role: Role;
	points: number;
	notifyOnFieldBooked: boolean;
	notifyOnOpenParty: boolean;
	createdAt: Date;
};

type NotificationPreferencesInput = {
	notifyOnFieldBooked?: boolean;
	notifyOnOpenParty?: boolean;
};

export class AuthServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = 'AuthServiceError';
		this.statusCode = statusCode;
	}
}

const getJwtSecret = () => {
	if (!process.env.JWT_SECRET) {
		throw new AuthServiceError('JWT_SECRET is not configured', 500);
	}

	return process.env.JWT_SECRET;
};

const parseAdminEmails = () => {
	const raw = process.env.ADMIN_EMAILS || '';

	return raw
		.split(',')
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
};

const isConfiguredAdminEmail = (email: string) => {
	const adminEmails = parseAdminEmails();
	return adminEmails.includes(email.toLowerCase());
};

const signToken = (userId: string, role: Role) => jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: '1h' });

export const registerUser = async (input: RegisterUserInput) => {
	const email = input.email.trim().toLowerCase();
	const username = input.username.trim().toLowerCase();
	const name = input.name.trim();

	const existingUser = await prisma.user.findUnique({ where: { email } });
	if (existingUser) {
		throw new AuthServiceError('User already exists', 409);
	}

	const hashedPassword = await bcrypt.hash(input.password, 10);
	const role: Role = isConfiguredAdminEmail(email) ? 'ADMIN' : 'USER';
	const newUser = await prisma.user.create({
		data: {
			email,
			password: hashedPassword,
			name,
			username,
			role: role as never,
		},
	});

	return { token: signToken(newUser.id, role) };
};

export const loginUser = async (input: LoginUserInput) => {
	const email = input.email.trim().toLowerCase();
	const username = input.username.trim().toLowerCase();

	const user = await prisma.user.findFirst({
		where: {
			OR: [
				{ email },
				{ username }
			]
		}
	});
	if (!user) {
		throw new AuthServiceError('Invalid email or password', 401);
	}

	const isPasswordValid = await bcrypt.compare(input.password, user.password);
	if (!isPasswordValid) {
		throw new AuthServiceError('Invalid email or password', 401);
	}

	const role = (user as unknown as { role?: Role }).role === 'ADMIN' ? 'ADMIN' : 'USER';

	return { token: signToken(user.id, role) };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
	const profile = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			username: true,
			role: true,
			points: true,
			notifyOnFieldBooked: true,
			notifyOnOpenParty: true,
			createdAt: true,
		},
	});

	if (!profile) {
		return null;
	}

	return {
		...profile,
		role: profile.role === 'ADMIN' ? 'ADMIN' : 'USER',
	};
};

export const updateNotificationPreferences = async (
	userId: string,
	input: NotificationPreferencesInput,
) => {
	const data: { notifyOnFieldBooked?: boolean; notifyOnOpenParty?: boolean } = {};

	if (typeof input.notifyOnFieldBooked === 'boolean') {
		data.notifyOnFieldBooked = input.notifyOnFieldBooked;
	}

	if (typeof input.notifyOnOpenParty === 'boolean') {
		data.notifyOnOpenParty = input.notifyOnOpenParty;
	}

	if (Object.keys(data).length === 0) {
		throw new AuthServiceError('No valid notification preferences provided', 400);
	}

	return prisma.user.update({
		where: { id: userId },
		data,
		select: {
			notifyOnFieldBooked: true,
			notifyOnOpenParty: true,
		},
	});
};

export const deleteUserAccount = async (userId: string): Promise<boolean> => {
	const deleted = await prisma.user.deleteMany({ where: { id: userId } });
	return deleted.count > 0;
};
