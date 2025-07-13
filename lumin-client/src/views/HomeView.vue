<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { onMounted, reactive, ref, watch } from 'vue';
import http, { toSubWeb } from "../utils/http"
import type { IProject } from '@/interface';
import { useRouter } from 'vue-router';

const user = useUserStore()
const userProjects = ref<IProject[]>()
const otherProjects = ref<IProject[]>()

const router = useRouter()

const createProject = async () => {
  const res = await http.post("/projects/create")
  router.push(`/detail/${res.data.project.id}`)
}

const deleteProject = async (id: number) => {
  const confirmDelete = window.confirm("确定要删除这个项目吗？");
  await http.delete("/projects/delete/" + id)
  if (!confirmDelete) return;

  userProjects.value = userProjects.value!.filter(p => p.id !== id);
}

const loadProject = async () => {
  const res = await http.get("/projects/search", {
    params: {
      userId: user.user?.id
    }
  })
  userProjects.value = res.data
}

const loadOtherProject = async () => {
  const res = await http.get("/projects/search", {
    params: {
      hasIndex: true
    }
  })
  otherProjects.value = res.data
}

watch(() => user.isLogin, () => {
  if (user.isLogin) {
    loadProject()
  }
}, { immediate: true })

onMounted(() => {
  loadOtherProject()
})

</script>

<template>
  <div v-if="user.isLogin">
    <button @click="createProject" class="btn w-full mt-3">创建</button>
    <div class="grid gap-4 mt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="p in userProjects" :key="p.id" class="card p-4 bg-base-100 shadow-sm">
        <router-link :to="`/detail/${p.id}`" class="text-lg font-bold m-0">
          {{ p.name }}
        </router-link>
        <button @click="deleteProject(p.id)" class="btn btn-error btn-sm absolute right-4 top-4">删除</button>
      </div>
    </div>
  </div>

  <h1 class="my-2 text-2xl font-bold">其他人作品</h1>
  <div v-for="project in otherProjects" class="flex gap-2">
    <a :href="toSubWeb(project)" class="link link-primary">{{ project.name }}</a>
    <p class="text-gray-400" v-if="project.author">作者：<strong>{{ project.author.username }}</strong></p>
  </div>
</template>