<template>
    <div>
        <p>666</p>
        {{ project }}
    </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import http from '../utils/http';
import type { IProject } from '@/interface';

const route = useRoute()
const project = ref<IProject>()
watch(
    () => route.params.id,
    async (newId) => {
        debugger
        if (!newId) return;
        const res = await http.get(`/projects/detail/${newId}`);
        project.value = res.data.project;
    },
    { immediate: true }
);

</script>