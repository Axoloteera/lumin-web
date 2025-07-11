import 'bun:dotenv';
import path from 'path';

export default {
    db: {
        uri: process.env.DATABASE_URL as string,
        options: {}
    },
    redis: process.env.REDIS_URL as string,
    jwt_secret: 'ASIODH(Y(*@(*Y(OIHOASD',
    jwt_expires_in: Math.floor(Date.now() / 1000) + 60 * 5,
    upload_folder: path.resolve(process.cwd(), process.env.UPLOAD_FOLDER || 'uploads'),
    github: {
        app_id: "1580260",
        private_key: process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_id: "Iv23liQ5ZYiVoxRAJeYv",
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        webhook_secret: "mjqwmxhn"
    }
};
