import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import ReactPaginate from 'react-paginate';
import { FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

function CommitsPage() {
  const [commits, setCommits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCommits();
  }, [currentPage, selectedProject]);

  const fetchCommits = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage + 1,
        limit: 20
      };

      if (selectedProject) {
        params.projectId = selectedProject;
      }

      const response = await axios.get('/api/commits', { params });
      setCommits(response.data.commits);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error('Error fetching commits');
      console.error('Error fetching commits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/commits/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleVote = async (commitId, voteType) => {
    try {
      await axios.post(`/api/commits/${commitId}/vote`, { type: voteType });
      fetchCommits();
      toast.success('Vote submitted!');
    } catch (error) {
      toast.error('Error voting on commit');
    }
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    setCurrentPage(0);
  };

  if (loading && commits.length === 0) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="loading">Loading commits...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Commit Tracker</h1>
          <p className="page-subtitle">
            {stats.totalCommits ? `${stats.totalCommits.toLocaleString()} commits` : 'No commits'}
            {stats.daysSinceFirst && ` over ${Math.ceil(stats.daysSinceFirst)} days`}
            {stats.commitsPerDay && ` (${stats.commitsPerDay.toFixed(2)} commits/day)`}
          </p>
        </div>

        {stats.totalCommits > 0 && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.totalCommits?.toLocaleString() || 0}</span>
              <span className="stat-label">Commits</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.uniqueAuthorsCount || 0}</span>
              <span className="stat-label">Developers</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{Math.ceil(stats.daysSinceFirst || 0)}</span>
              <span className="stat-label">Days</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.commitsPerDay?.toFixed(1) || '0.0'}</span>
              <span className="stat-label">Commits/day</span>
            </div>
          </div>
        )}

        <div className="filters">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Project:</label>
              <select
                className="filter-select"
                value={selectedProject}
                onChange={handleProjectChange}
              >
                <option value="">All projects</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {commits.length === 0 ? (
          <div className="empty-state">
            <h3>No commits</h3>
            <p>Add a project and configure webhooks to start tracking commits.</p>
          </div>
        ) : (
          <>
            <div className="commits-container">
              {commits.map(commit => (
                <div key={commit._id} className="commit-item">
                  <div className="commit-header">
                    <img
                      src={commit.author.avatar || `https://github.com/${commit.author.username}.png?size=32`}
                      alt={commit.author.name}
                      className="commit-avatar"
                    />
                    <span className="commit-author">{commit.author.name}</span>
                    <span className="commit-time">
                      {formatDistanceToNow(new Date(commit.timestamp), {
                        addSuffix: true,
                        locale: enUS
                      })}
                    </span>
                  </div>

                  <div className="commit-message">
                    {commit.message}
                  </div>

                  <div className="commit-meta">
                    <div>
                      <span className="commit-project">
                        {commit.projectId?.name || 'Unknown Project'}
                      </span>
                      {commit.branch && (
                        <span className="commit-branch">{commit.branch}</span>
                      )}
                    </div>

                    <div className="commit-votes">
                      <button
                        className="vote-button"
                        onClick={() => handleVote(commit._id, 'up')}
                      >
                        <FiThumbsUp />
                        {commit.votes.up}
                      </button>
                      <button
                        className="vote-button"
                        onClick={() => handleVote(commit._id, 'down')}
                      >
                        <FiThumbsDown />
                        {commit.votes.down}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <ReactPaginate
                  pageCount={totalPages}
                  onPageChange={handlePageChange}
                  forcePage={currentPage}
                  containerClassName="pagination"
                  activeClassName="active"
                  previousLabel="‹"
                  nextLabel="›"
                  pageRangeDisplayed={5}
                  marginPagesDisplayed={2}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CommitsPage;