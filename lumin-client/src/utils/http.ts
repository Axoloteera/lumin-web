import type { IProject } from "@/interface";
import axios from "axios";
import { useToast } from "vue-toastification";

const instance = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    timeout: 1000,
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

const toast = useToast();

instance.interceptors.response.use(
    (response) => {
        const data = response.data;
        const config = response.config as any;

        const shouldToast = config.showToast !== false;

        if (shouldToast) {
            if (data?.message) {
                toast.success(data.message);
            }
            if (data?.info) {
                toast.info(data.info);
            }
            if (data?.error) {
                toast.error(data.error);
            }
        }

        return response;
    },
    (error) => {
        const config = error.config as any;

        const shouldToast = config?.showToast !== false;

        if (shouldToast) {
            const data = error.response.data
            if (!error.response) {
                toast.error('网络连接失败，请检查网络或服务器');
            } else if (error.response.status >= 500) {
                toast.error(`服务器错误（${error.response.status}）`);
            } else if (data.error) {
                toast.error(data.error);
            }
        }

        return Promise.reject(error);
    }
);

declare module 'axios' {
    export interface AxiosRequestConfig {
        showToast?: boolean;
    }
}

export default instance


export const toSubWeb = (project?: IProject) => {
    if (!project || !project.domain) {
        return ''
    }

    if (import.meta.env.VITE_DEV) {
        return `${import.meta.env.VITE_SERVER_URL}projects/view/${project.domain}/`
    } else {
        return `${project.domain}.${import.meta.env.VITE_WEBSITE_DOMAIN}`
    }
}