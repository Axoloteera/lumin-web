<template>
    <div class="flex flex-col gap-3 card bg-base-100 shadow-sm mx-auto p-4 mt-4">
        <p class="text-3xl font-bold mx-auto">编辑作品</p>
        <div class="flex">
            <p class="text-2xl" v-if="project?.domain">访问: <a :href="websiteUrl" class="link link-primary">{{ websiteUrl }}</a></p>
            <p class="text-2xl" v-else>请先设置子域名后访问您的网站</p>
            <div class="flex-1"></div>
            <router-link class="btn btn-primary" :to="`/editor/${project?.id}`">进入编辑器</router-link>
        </div>
        <Field :errors="errors.name" label="作品名" v-slot="{ inputClasses }">
            <input v-model="name" v-bind="nameAttrs" type="text" class="input w-full" :class="inputClasses"
                placeholder="作品名" />
        </Field>

        <Field :errors="errors.domain" label="子域名" v-slot="{ inputClasses }">
            <input v-model="domain" v-bind="domainAttrs" type="text" class="input w-full" :class="inputClasses"
                placeholder="子域名" />
        </Field>

        <Field :errors="errors.description" label="简介" v-slot="{ inputClasses }">
            <textarea v-model="description" v-bind="descriptionAttrs" class="textarea w-full"
                :class="inputClasses"></textarea>
        </Field>

        <Field :errors="errors.description" label="网站内容ZIP文件" v-slot="{ inputClasses }">
            <input type="file" ref="fileInput" @change="handleFileChange" v-bind="fileAttrs" class="file-input w-full"
                :class="inputClasses" accept=".zip" />
            <label class="label">zip文件，最大 100MB</label>
        </Field>

        <button @click="submitForm" class="btn" :disabled="loading">{{ loading ? "加载中..." : "更新" }}</button>
    </div>

</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as zod from 'zod';
import http, { toSubWeb } from '../utils/http';
import type { IProject } from '@/interface';
import Field from '@/components/Field.vue';

const loading = ref(false)
const validationSchema = toTypedSchema(
    zod.object({
        name: zod.string().min(1).max(12),
        domain: zod.string().min(1).max(12).regex(/^[a-zA-Z0-9_]+$/, { message: '只能包含字母、数字和下划线哦' }),
        file: zod
            .instanceof(File, { message: '请上传一个文件' })
            .refine((file) => file.size <= 100 * 1024 * 1024, '文件大小不能超过100MB')
            .optional(),
        description: zod.string().max(4089)
    })
);

const { defineField, handleSubmit, errors, setValues } = useForm({
    validationSchema,
});

const [domain, domainAttrs] = defineField('domain');
const [name, nameAttrs] = defineField('name');
const [description, descriptionAttrs] = defineField('description');

const [file, fileAttrs] = defineField('file');

const route = useRoute();
const project = ref<IProject>();
const fileInput = ref<HTMLInputElement | null>(null);

const websiteUrl = computed(() => toSubWeb(project.value));

watch(
    () => route.params.id,
    async (newId) => {
        if (!newId) return;
        const res = await http.get(`/projects/detail/${newId}`);
        project.value = res.data.project;
        setValues(res.data.project)
    },
    { immediate: true }
);

const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        file.value = input.files[0]
    }
};

const submitForm = handleSubmit(async (values) => {
    loading.value = true
    try {
        const update = await http.post('/projects/update/' + project.value?.id, values)

        if (values.file) {
            const formData = new FormData();
            formData.append('file', values.file);

            await http.post('/projects/upload-zip/' + project.value?.id, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }

        project.value = update.data.project
    } finally {
        loading.value = false
    }
});
</script>