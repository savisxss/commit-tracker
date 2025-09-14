<template>
  <div class="page-container">
    <div class="container">
      <div v-if="loading" class="loading">
        Loading projects...
      </div>

      <template v-else>
        <div class="page-header">
          <h1 class="page-title">Projects</h1>
          <p class="page-subtitle">Manage projects and configure webhooks</p>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 2rem">
          <button
            class="btn btn-primary"
            @click="showModal = true"
          >
            <PlusIcon class="w-4 h-4" style="margin-right: 0.5rem" />
            Add Project
          </button>
        </div>

        <div v-if="projects.length === 0" class="empty-state">
          <h3>No projects</h3>
          <p>Add your first project to start tracking commits.</p>
          <button
            class="btn btn-primary"
            @click="showModal = true"
            style="margin-top: 1rem"
          >
            Add Project
          </button>
        </div>

        <div v-else class="grid grid-2">
          <div
            v-for="project in projects"
            :key="project._id"
            class="card"
          >
            <div class="card-header">
              <div>
                <h3 class="card-title">{{ project.name }}</h3>
                <p class="card-subtitle">{{ project.description }}</p>
              </div>
              <div class="card-actions">
                <button
                  class="btn btn-secondary"
                  @click="copyWebhookUrl(project._id)"
                  title="Copy Webhook URL"
                >
                  <DocumentDuplicateIcon class="w-4 h-4" />
                </button>
                <button
                  class="btn btn-danger"
                  @click="handleDelete(project._id)"
                  title="Delete project"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div style="margin-bottom: 1rem">
              <strong>Repository:</strong>
              <div style="font-family: monospace; font-size: 0.9rem; color: #666">
                {{ project.repositoryUrl }}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #666">
              <span>Commits: {{ project.totalCommits || 0 }}</span>
              <span>
                {{
                  project.lastCommitAt
                    ? `Last: ${new Date(project.lastCommitAt).toLocaleDateString('en-US')}`
                    : 'No commits'
                }}
              </span>
            </div>

            <div class="webhook-info">
              <h4>Webhook Configuration</h4>
              <div class="webhook-url">
                {{ `${window.location.origin}/api/webhook/${project._id}` }}
              </div>
              <small>
                Configure this URL as a webhook in your GitHub repository settings
                (Settings → Webhooks → Add webhook)
              </small>
            </div>
          </div>
        </div>

        <!-- Modal -->
        <div v-if="showModal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="modal-title">New Project</h2>
              <button
                class="close-btn"
                @click="showModal = false"
              >
                ×
              </button>
            </div>

            <form @submit.prevent="handleSubmit">
              <div class="form-group">
                <label class="form-label">Project name *</label>
                <input
                  type="text"
                  name="name"
                  class="form-input"
                  v-model="formData.name"
                  required
                  placeholder="e.g. My Awesome Project"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <input
                  type="text"
                  name="description"
                  class="form-input"
                  v-model="formData.description"
                  placeholder="Brief project description"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Repository URL *</label>
                <input
                  type="url"
                  name="repositoryUrl"
                  class="form-input"
                  v-model="formData.repositoryUrl"
                  required
                  placeholder="https://github.com/username/repository"
                />
              </div>

              <div style="display: flex; gap: 1rem; justify-content: flex-end">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="showModal = false"
                >
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue'
import { PlusIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline'
import axios from 'axios'
import { useToast } from 'vue-toastification'

export default {
  name: 'ProjectsPage',
  components: {
    PlusIcon,
    TrashIcon,
    DocumentDuplicateIcon
  },
  setup() {
    const toast = useToast()

    const projects = ref([])
    const loading = ref(true)
    const showModal = ref(false)
    const formData = reactive({
      name: '',
      description: '',
      repositoryUrl: ''
    })

    const fetchProjects = async () => {
      try {
        loading.value = true
        const response = await axios.get('/api/projects')
        projects.value = response.data
      } catch (error) {
        toast.error('Error fetching projects')
        console.error('Error fetching projects:', error)
      } finally {
        loading.value = false
      }
    }

    const handleSubmit = async () => {
      try {
        const response = await axios.post('/api/projects', formData)
        projects.value = [response.data, ...projects.value]
        showModal.value = false

        // Reset form
        formData.name = ''
        formData.description = ''
        formData.repositoryUrl = ''

        toast.success('Project created successfully!')

        // Show webhook information
        toast.success(
          `Configure webhook in GitHub:\nURL: ${response.data.webhookUrl}\nSecret: ${response.data.webhookSecret}`,
          { timeout: 10000 }
        )
      } catch (error) {
        toast.error('Error creating project')
        console.error('Error creating project:', error)
      }
    }

    const handleDelete = async (projectId) => {
      if (!window.confirm('Are you sure you want to delete this project?')) return

      try {
        await axios.delete(`/api/projects/${projectId}`)
        projects.value = projects.value.filter(p => p._id !== projectId)
        toast.success('Project deleted successfully')
      } catch (error) {
        toast.error('Error deleting project')
        console.error('Error deleting project:', error)
      }
    }

    const copyWebhookUrl = (projectId) => {
      const webhookUrl = `${window.location.origin}/api/webhook/${projectId}`
      navigator.clipboard.writeText(webhookUrl)
      toast.success('Webhook URL copied!')
    }

    onMounted(() => {
      fetchProjects()
    })

    return {
      projects,
      loading,
      showModal,
      formData,
      handleSubmit,
      handleDelete,
      copyWebhookUrl
    }
  }
}
</script>