import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCopy } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repositoryUrl: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Error fetching projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/projects', formData);
      setProjects([response.data, ...projects]);
      setShowModal(false);
      setFormData({ name: '', description: '', repositoryUrl: '' });

      toast.success('Project created successfully!');

      // Show webhook information
      const webhookInfo = `
        Webhook URL: ${response.data.webhookUrl}
        Secret: ${response.data.webhookSecret}
      `;

      toast(
        <div>
          <strong>Configure webhook in GitHub:</strong>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '8px' }}>
            <div>URL: {response.data.webhookUrl}</div>
            <div>Secret: {response.data.webhookSecret}</div>
          </div>
        </div>,
        { duration: 10000 }
      );

    } catch (error) {
      toast.error('Error creating project');
      console.error('Error creating project:', error);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await axios.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter(p => p._id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error('Error deleting project');
      console.error('Error deleting project:', error);
    }
  };

  const copyWebhookUrl = (projectId) => {
    const webhookUrl = `${window.location.origin}/api/webhook/${projectId}`;
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied!');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="loading">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage projects and configure webhooks</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <FiPlus style={{ marginRight: '0.5rem' }} />
            Add Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects</h3>
            <p>Add your first project to start tracking commits.</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              style={{ marginTop: '1rem' }}
            >
              Add Project
            </button>
          </div>
        ) : (
          <div className="grid grid-2">
            {projects.map(project => (
              <div key={project._id} className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{project.name}</h3>
                    <p className="card-subtitle">{project.description}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => copyWebhookUrl(project._id)}
                      title="Copy Webhook URL"
                    >
                      <FiCopy />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(project._id)}
                      title="Delete project"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Repository:</strong>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#666' }}>
                    {project.repositoryUrl}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666' }}>
                  <span>Commits: {project.totalCommits || 0}</span>
                  <span>
                    {project.lastCommitAt
                      ? `Last: ${new Date(project.lastCommitAt).toLocaleDateString('en-US')}`
                      : 'No commits'
                    }
                  </span>
                </div>

                <div className="webhook-info">
                  <h4>Webhook Configuration</h4>
                  <div className="webhook-url">
                    {`${window.location.origin}/api/webhook/${project._id}`}
                  </div>
                  <small>
                    Configure this URL as a webhook in your GitHub repository settings
                    (Settings → Webhooks → Add webhook)
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">New Project</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Project name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. My Awesome Project"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    name="description"
                    className="form-input"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief project description"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Repository URL *</label>
                  <input
                    type="url"
                    name="repositoryUrl"
                    className="form-input"
                    value={formData.repositoryUrl}
                    onChange={handleInputChange}
                    required
                    placeholder="https://github.com/username/repository"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectsPage;