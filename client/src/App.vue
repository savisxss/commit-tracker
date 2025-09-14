<template>
  <div class="App">
    <nav class="navbar">
      <div class="container">
        <router-link to="/" class="nav-brand">
          Commit Tracker
        </router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Commits</router-link>
          <router-link to="/projects" class="nav-link">Projects</router-link>
        </div>
      </div>
    </nav>

    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
@import './App.css';
</style>