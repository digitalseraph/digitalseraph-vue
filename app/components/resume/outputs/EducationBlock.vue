<script setup lang="ts">
const resume = useResume();
const education = computed(() => resume.value?.education ?? []);
const certs = computed(() => resume.value?.certifications ?? []);

function fmtYearMonth(d: string): string {
  const [y, m] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = parseInt(m, 10) - 1;
  return `${months[mi] ?? m} ${y}`;
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <div class="text-[var(--text-dim)] text-xs uppercase tracking-[0.15em] mb-1.5">education</div>
      <div v-for="(ed, i) in education" :key="i" class="text-[var(--text-muted)]">
        <div class="text-[var(--text)] font-semibold">{{ ed.degree }}<span v-if="ed.field"> — {{ ed.field }}</span></div>
        <div>{{ ed.school }} · {{ ed.location }} · {{ ed.year }}</div>
      </div>
    </div>
    <div v-if="certs.length">
      <div class="text-[var(--text-dim)] text-xs uppercase tracking-[0.15em] mb-1.5">certifications</div>
      <div v-for="(cert, i) in certs" :key="i" class="text-[var(--text-muted)]">
        <span class="text-[var(--text)]">{{ cert.name }}</span>
        <span v-if="cert.code"> — {{ cert.code }}</span>
        <span class="text-[var(--text-dim)]"> · issued {{ fmtYearMonth(cert.issued) }}</span>
      </div>
    </div>
  </div>
</template>
