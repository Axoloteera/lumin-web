<template>
    <div class="flex flex-1">
        <splitpanes class="default-theme">
            <pane min-size="30">
                1
            </pane>
            <pane>
                <splitpanes class="default-theme" horizontal>
                    <pane min-size="80">
                        2
                    </pane>
                    <pane>4</pane>
                </splitpanes>
            </pane>
        </splitpanes>
    </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import http, { toSubWeb } from '../utils/http';
import type { IProject } from '@/interface';

import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

const route = useRoute()
const project = ref<IProject>()
watch(
    () => route.params.id,
    async (newId) => {
        if (!newId) return;
        const res = await http.get(`/projects/detail/${newId}`);
        project.value = res.data.project;
    },
    { immediate: true }
);
</script>