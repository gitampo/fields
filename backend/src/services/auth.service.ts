import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

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
	points: number;
	createdAt: Date;
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

const signToken = (userId: string) => jwt.sign({ userId }, getJwtSecret(), { expiresIn: '1h' });

export const registerUser = async (input: RegisterUserInput) => {
	const email = input.email.trim().toLowerCase();
	const username = input.username.trim().toLowerCase();
	const name = input.name.trim();

	const existingUser = await prisma.user.findUnique({ where: { email } });
	if (existingUser) {
		throw new AuthServiceError('User already exists', 409);
	}

	const hashedPassword = await bcrypt.hash(input.password, 10);
	const newUser = await prisma.user.create({
		data: {
			email,
			password: hashedPassword,
			name,
			username,
		},
	});

	return { token: signToken(newUser.id) };
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

	return { token: signToken(user.id) };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
	return prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			username: true,
			points: true,
			createdAt: true,
		},
	});
};

export const deleteUserAccount = async (userId: string): Promise<boolean> => {
	const deleted = await prisma.user.deleteMany({ where: { id: userId } });
	return deleted.count > 0;
};
