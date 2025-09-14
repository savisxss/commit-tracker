<template>
  <div class="page-container">
    <div class="container">
      <div v-if="loading && commits.length === 0" class="loading">
        Loading commits...
      </div>

      <template v-else>
        <div class="page-header">
          <h1 class="page-title">Commit Tracker</h1>
          <p class="page-subtitle">
            {{ stats.totalCommits ? `${stats.totalCommits.toLocaleString()} commits` : 'No commits' }}
            <span v-if="stats.daysSinceFirst"> over {{ Math.ceil(stats.daysSinceFirst) }} days</span>
            <span v-if="stats.commitsPerDay"> ({{ stats.commitsPerDay.toFixed(2) }} commits/day)</span>
          </p>
        </div>

        <div v-if="stats.totalCommits > 0" class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats.totalCommits?.toLocaleString() || 0 }}</span>
            <span class="stat-label">Commits</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.uniqueAuthorsCount || 0 }}</span>
            <span class="stat-label">Developers</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ Math.ceil(stats.daysSinceFirst || 0) }}</span>
            <span class="stat-label">Days</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.commitsPerDay?.toFixed(1) || '0.0' }}</span>
            <span class="stat-label">Commits/day</span>
          </div>
        </div>

        <div class="filters">
          <div class="filters-row">
            <div class="filter-group">
              <label class="filter-label">Project:</label>
              <select
                class="filter-select"
                v-model="selectedProject"
                @change="handleProjectChange"
              >
                <option value="">All projects</option>
                <option
                  v-for="project in projects"
                  :key="project._id"
                  :value="project._id"
                >
                  {{ project.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="commits.length === 0" class="empty-state">
          <h3>No commits</h3>
          <p>Add a project and configure webhooks to start tracking commits.</p>
        </div>

        <template v-else>
          <div class="commits-container">
            <div
              v-for="commit in commits"
              :key="commit._id"
              class="commit-item"
            >
              <div class="commit-header">
                <img
                  :src="commit.author.avatar || `https://github.com/${commit.author.username}.png?size=32`"
                  :alt="commit.author.name"
                  class="commit-avatar"
                />
                <span class="commit-author">{{ commit.author.name }}</span>
                <span class="commit-time">
                  {{ formatDistanceToNow(new Date(commit.timestamp), {
                    addSuffix: true,
                    locale: enUS
                  }) }}
                </span>
              </div>

              <div class="commit-message">
                {{ commit.message }}
              </div>

              <div class="commit-meta">
                <div>
                  <span class="commit-project">
                    {{ commit.projectId?.name || 'Unknown Project' }}
                  </span>
                  <span v-if="commit.branch" class="commit-branch">{{ commit.branch }}</span>
                </div>

                <div class="commit-votes">
                  <button
                    class="vote-button"
                    @click="handleVote(commit._id, 'up')"
                  >
                    <ThumbUpIcon class="w-4 h-4" />
                    {{ commit.votes.up }}
                  </button>
                  <button
                    class="vote-button"
                    @click="handleVote(commit._id, 'down')"
                  >
                    <ThumbDownIcon class="w-4 h-4" />
                    {{ commit.votes.down }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="totalPages > 1" class="pagination-container">
            <nav class="pagination">
              <button
                @click="currentPage > 0 && setPage(currentPage - 1)"
                :disabled="currentPage === 0"
                class="pagination-btn"
              >
                ‹
              </button>

              <template v-for="page in visiblePages" :key="page">
                <button
                  v-if="page !== '...'"
                  @click="setPage(page - 1)"
                  :class="['pagination-btn', { active: page - 1 === currentPage }]"
                >
                  {{ page }}
                </button>
                <span v-else class="pagination-ellipsis">...</span>
              </template>

              <button
                @click="currentPage < totalPages - 1 && setPage(currentPage + 1)"
                :disabled="currentPage === totalPages - 1"
                class="pagination-btn"
              >
                ›
              </button>
            </nav>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { HandThumbUpIcon as ThumbUpIcon, HandThumbDownIcon as ThumbDownIcon } from '@heroicons/vue/24/outline'
import axios from 'axios'
import { useToast } from 'vue-toastification'

export default {
  name: 'CommitsPage',
  components: {
    ThumbUpIcon,
    ThumbDownIcon
  },
  setup() {
    const toast = useToast()

    const commits = ref([])
    const projects = ref([])
    const stats = ref({})
    const loading = ref(true)
    const currentPage = ref(0)
    const totalPages = ref(0)
    const selectedProject = ref('')

    const fetchCommits = async () => {
      try {
        loading.value = true
        const params = {
          page: currentPage.value + 1,
          limit: 20
        }

        if (selectedProject.value) {
          params.projectId = selectedProject.value
        }

        const response = await axios.get('/api/commits', { params })
        commits.value = response.data.commits
        totalPages.value = response.data.pagination.totalPages
      } catch (error) {
        toast.error('Error fetching commits')
        console.error('Error fetching commits:', error)
      } finally {
        loading.value = false
      }
    }

    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects')
        projects.value = response.data
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }

    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/commits/stats')
        stats.value = response.data
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    const handleVote = async (commitId, voteType) => {
      try {
        await axios.post(`/api/commits/${commitId}/vote`, { type: voteType })
        fetchCommits()
        toast.success('Vote submitted!')
      } catch (error) {
        toast.error('Error voting on commit')
      }
    }

    const setPage = (page) => {
      currentPage.value = page
    }

    const handleProjectChange = () => {
      currentPage.value = 0
    }

    const visiblePages = computed(() => {
      const pages = []
      const current = currentPage.value + 1
      const total = totalPages.value

      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)

        if (current > 4) {
          pages.push('...')
        }

        const start = Math.max(2, current - 2)
        const end = Math.min(total - 1, current + 2)

        for (let i = start; i <= end; i++) {
          pages.push(i)
        }

        if (current < total - 3) {
          pages.push('...')
        }

        pages.push(total)
      }

      return pages
    })

    onMounted(() => {
      fetchProjects()
      fetchStats()
    })

    watch([currentPage, selectedProject], () => {
      fetchCommits()
    })

    return {
      commits,
      projects,
      stats,
      loading,
      currentPage,
      totalPages,
      selectedProject,
      handleVote,
      setPage,
      handleProjectChange,
      visiblePages,
      formatDistanceToNow,
      enUS
    }
  }
}
</script>