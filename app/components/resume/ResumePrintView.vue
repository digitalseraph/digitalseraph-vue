<script setup lang="ts">
import { fmtDatePrint } from "~/utils/resumeDate";

const resume = useResume();
const r = computed(() => resume.value);

function today(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
</script>

<template>
  <div v-if="r" class="print-view" aria-hidden="true">
    <header class="doc-header">
      <h1>{{ r.header.name }}</h1>
      <p class="title">{{ r.header.title }} · {{ r.header.subtitle }}</p>
      <p class="contact">
        {{ r.header.location }} · {{ r.header.email }} ·
        github.com/{{ r.header.github }} · linkedin.com/in/{{ r.header.linkedin }}
      </p>
    </header>

    <section class="summary">
      <h2>Professional Summary</h2>
      <p>{{ r.summary }}</p>
    </section>

    <section class="skills">
      <h2>Technical Skills</h2>
      <div v-for="group in r.skills" :key="group.group" class="skill-line">
        <strong>{{ group.group }}:</strong> {{ group.items.join(", ") }}
      </div>
    </section>

    <section class="experience">
      <h2>Work Experience</h2>
      <div v-for="(role, i) in r.experience" :key="i" class="role">
        <div class="role-header">
          <strong>{{ role.role }}</strong>
          <span class="dates">{{ fmtDatePrint(role.start) }} – {{ fmtDatePrint(role.end) }}</span>
        </div>
        <div class="role-meta"><em>{{ role.company }} — {{ role.location }}</em></div>
        <ul>
          <li v-for="(b, bi) in role.bullets" :key="bi">{{ b }}</li>
        </ul>
        <div class="tech"><em>Tech: {{ role.tech.join(", ") }}</em></div>
      </div>
    </section>

    <section class="education">
      <h2>Education</h2>
      <div v-for="(ed, i) in r.education" :key="i">
        <strong>{{ ed.degree }}<span v-if="ed.field"> — {{ ed.field }}</span></strong>
        <div>{{ ed.school }}, {{ ed.location }} · {{ ed.year }}</div>
      </div>
    </section>

    <section v-if="r.certifications.length" class="certifications">
      <h2>Certifications</h2>
      <div v-for="(c, i) in r.certifications" :key="i">
        {{ c.name }}<span v-if="c.code"> — {{ c.code }}</span> · Issued {{ fmtDatePrint(c.issued) }}
      </div>
    </section>

    <footer class="doc-footer">digitalseraph.com · generated {{ today() }}</footer>
  </div>
</template>

<style scoped>
.print-view { display: none; }

@media print {
  .print-view {
    display: block;
    color: #111;
    background: #fff;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 9.5pt;
    line-height: 1.35;
  }
  .print-view h1 {
    font-size: 22pt;
    font-weight: 700;
    margin: 0 0 2pt;
    letter-spacing: -0.01em;
  }
  .print-view h2 {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid #111;
    margin: 10pt 0 4pt;
    padding-bottom: 1pt;
  }
  .doc-header { margin-bottom: 8pt; }
  .doc-header .title { margin: 0 0 2pt; font-style: italic; font-size: 10pt; }
  .doc-header .contact { margin: 0; font-size: 8.5pt; }
  .skill-line { margin-bottom: 2pt; }
  .role { margin-bottom: 6pt; break-inside: avoid; }
  .role-header { display: flex; justify-content: space-between; align-items: baseline; }
  .role-header .dates { font-style: italic; font-size: 9pt; }
  .role-meta { margin-bottom: 2pt; font-size: 9pt; }
  .role ul { margin: 2pt 0; padding-left: 14pt; }
  .role li { margin-bottom: 1pt; }
  .tech { margin-top: 2pt; font-size: 8.5pt; color: #333; }
  .doc-footer { margin-top: 16pt; font-size: 8pt; color: #666; text-align: center; }
}

@page { size: letter; margin: 0.6in; }
</style>
