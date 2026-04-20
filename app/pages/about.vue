<script setup lang="ts">
const { data: about } = await useAsyncData("about", () =>
  queryCollection("about").first()
);
useSeoMeta({
  title: "About — digitalseraph",
  ogTitle: "About — digitalseraph",
  ogDescription: "Senior Full-Stack Engineer with 10+ years across healthcare, fintech, e-commerce, and media. HIPAA-certified.",
  ogImage: "https://digitalseraph.com/og/site.svg",
  ogType: "website",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <section class="max-w-[1280px] mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ cat about.md</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-12">about</h1>

    <div class="grid lg:grid-cols-[1fr_300px] gap-12">
      <article class="prose prose-invert max-w-none min-w-0">
        <ContentRenderer v-if="about" :value="about" />
      </article>

      <aside class="space-y-8 lg:sticky lg:top-20 lg:self-start">
        <div class="rounded-md border border-[var(--accent)] bg-[var(--canvas-raised)] p-4 font-mono text-[var(--text-mono)]">
          <div class="text-[var(--accent)] tracking-[0.2em] uppercase mb-3">$ cat now.md</div>
          <dl class="space-y-2">
            <div>
              <dt class="text-[var(--text-dim)]">currently</dt>
              <dd class="text-[var(--text)]">lead engineer on Jump, Cox's internal URL shortener platform</dd>
            </div>
            <div>
              <dt class="text-[var(--text-dim)]">learning</dt>
              <dd class="text-[var(--text)]">Next.js 15, AI-augmented development workflows</dd>
            </div>
            <div>
              <dt class="text-[var(--text-dim)]">available for</dt>
              <dd class="text-[var(--text)]">senior/staff IC roles · full-time or contract · remote or Atlanta metro</dd>
            </div>
          </dl>
        </div>

        <div>
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] tracking-[0.2em] uppercase mb-3">$ status</div>
          <div class="font-mono text-[var(--text-mono-l)] text-[var(--accent)]">Currently exploring roles</div>
        </div>

        <div>
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] tracking-[0.2em] uppercase mb-3">$ whoami --brief</div>
          <dl class="space-y-2 font-mono text-[var(--text-mono)]">
            <div class="flex gap-3">
              <dt class="text-[var(--text-dim)] min-w-[80px]">role</dt>
              <dd class="text-[var(--text)]">Senior Software Engineer III</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-[var(--text-dim)] min-w-[80px]">company</dt>
              <dd class="text-[var(--text)]">Cox Communications</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-[var(--text-dim)] min-w-[80px]">location</dt>
              <dd class="text-[var(--text)]">Marietta, GA · Remote</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-[var(--text-dim)] min-w-[80px]">years</dt>
              <dd class="text-[var(--text)]">10+</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-[var(--text-dim)] min-w-[80px]">timezone</dt>
              <dd class="text-[var(--text)]">EST · UTC-5</dd>
            </div>
          </dl>
        </div>

        <div>
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] tracking-[0.2em] uppercase mb-3">$ ls skills/ --top</div>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="s in ['Vue 3','TypeScript','PHP/Laravel','AWS','GKE','Docker','Kubernetes','Node.js']" :key="s"
              class="inline-block px-2 py-0.5 rounded-full border border-[var(--line)] text-[var(--text)] text-xs font-mono">{{ s }}</span>
          </div>
        </div>

        <div>
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] tracking-[0.2em] uppercase mb-3">$ cat certs/</div>
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-muted)]">HIPAA Security &amp; Privacy (H109)</div>
        </div>

        <div>
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] tracking-[0.2em] uppercase mb-3">$ jump</div>
          <div class="flex flex-col gap-2 font-mono text-[var(--text-mono)]">
            <NuxtLink to="/resume" class="text-[var(--accent)] hover:underline underline-offset-4">→ interactive résumé</NuxtLink>
            <NuxtLink to="/work" class="text-[var(--accent)] hover:underline underline-offset-4">→ selected work</NuxtLink>
            <NuxtLink to="/contact" class="text-[var(--accent)] hover:underline underline-offset-4">→ get in touch</NuxtLink>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
