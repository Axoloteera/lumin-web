// src/user/index.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { randomBytes } from 'crypto';

import { redis } from '../database';
import { User } from '../database/models/user';
import config from '../config';
import { hashPassword, comparePassword } from '../utils/hash';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';
import { authMiddleware } from '../middleware/auth';

import {
    registerSendEmailSchema,
    verifyEmailSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '../validators/user';
import { createToken } from '../services/userService';

const user = new Hono();

// --- 注册流程 ---

// 步骤 1: 发送验证邮件
user.post('/register/send-email', zValidator('json', registerSendEmailSchema), async (c) => {
    const { email } = c.req.valid('json');

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return c.json({ error: '该邮箱已被注册' }, 409); // 409 Conflict
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`verify_code:${email}`, verificationCode, 'EX', 600);

    // 异步发送邮件
    await sendVerificationEmail(email, verificationCode);

    return c.json({ message: '测试阶段不发送邮箱，验证码为' + verificationCode });
});

// 步骤 2: 验证邮箱并创建用户
user.post('/register/verify', zValidator('json', verifyEmailSchema), async (c) => {
    const { email, code, password, username } = c.req.valid('json');

    const storedCode = await redis.get(`verify_code:${email}`);
    if (!storedCode || storedCode !== code) {
        return c.json({ error: '验证码无效或已过期' }, 400);
    }

    // 创建用户
    const newUser = await User.create({
        email,
        password: await hashPassword(password),
        username,
    });

    await redis.del(`verify_code:${email}`);
    const token = await createToken(newUser)
    return c.json({
        message: '用户注册成功！',
        user: newUser.serlize(),
        token: token
    }, 201);
});

// --- 登录 ---
user.post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    const foundUser = await User.findOne({ where: { email } });
    if (!foundUser) {
        return c.json({ error: '无效的邮箱或错误的密码' }, 401);
    }
    const isPasswordValid = await comparePassword(password, foundUser.password);
    if (!isPasswordValid) {
        return c.json({ error: '无效的邮箱或错误的密码' }, 401);
    }

    const token = await createToken(foundUser)

    return c.json({ token, message: "登录成功", user: foundUser.serlize() });
});

// --- 登出 ---
user.post('/logout', authMiddleware, async (c) => {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    const userPayload = c.get('user');

    if (token && userPayload) {
        const expiresIn = userPayload.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
            await redis.set(`blocklist:${token}`, 'true', 'EX', expiresIn);
        }
    }

    return c.json({ message: '成功登出' });
});


// --- 忘记密码 ---

// 步骤 1: 请求重置密码
user.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
    const { email } = c.req.valid('json');
    const foundUser = await User.findOne({ where: { email } });

    if (foundUser) {
        const resetToken = randomBytes(32).toString('hex');
        // 将 token 作为 key，email 作为 value 存入 Redis
        await redis.set(`reset:${resetToken}`, email, 'EX', 1800); // 30分钟过期
        await sendPasswordResetEmail(email, resetToken);
    }

    // 无论用户是否存在，都返回相同的成功信息，防止邮箱嗅探
    return c.json({ message: '如果您的邮箱已注册，您将收到一封密码重置邮件。' });
});

// 步骤 2: 使用令牌重置密码
user.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
    const { token, newPassword } = c.req.valid('json');

    const email = await redis.get(`reset:${token}`);
    if (!email) {
        return c.json({ error: '令牌无效或已过期' }, 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await User.update({ password: hashedPassword }, { where: { email } });

    // 用完后立即删除令牌
    await redis.del(`reset:${token}`);

    return c.json({ message: '密码已成功重置' });
});


user.get('/me', authMiddleware, (c) => {
    const userPayload = c.get('user');
    return c.json({
        user: userPayload.user.serlize(),
    });
});

export default user;