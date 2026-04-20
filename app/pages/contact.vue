<script setup lang="ts">
import CopyInline from "~/components/primitives/CopyInline.vue";
import PillLink from "~/components/primitives/PillLink.vue";
useSeoMeta({
  title: "Contact — digitalseraph",
  ogTitle: "Contact — digitalseraph",
  ogDescription: "Get in touch — email, GitHub, LinkedIn. Response within 2 business days.",
  ogImage: "https://digitalseraph.com/og/site.svg",
  ogType: "website",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <section class="max-w-2xl mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ contact</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">contact</h1>

    <p class="text-[var(--text-muted)] mb-8">The simplest way is email. If you prefer something else, pick a link below.</p>

    <div class="font-mono text-[var(--text-mono-l)] mb-10">
      <CopyInline value="hello@digitalseraph.com" />
    </div>

    <div class="flex flex-wrap gap-3 mb-12">
      <PillLink href="https://github.com/digitalseraph" external>github</PillLink>
      <PillLink href="https://linkedin.com/in/davidthedeveloper" external>linkedin</PillLink>
      <PillLink href="/resume">interactive résumé →</PillLink>
    </div>

    <dl class="space-y-4 font-mono text-[var(--text-mono)] border-t border-[var(--line)] pt-8">
      <div class="flex gap-4">
        <dt class="text-[var(--text-dim)] min-w-[140px]">response time</dt>
        <dd class="text-[var(--text-muted)]">within 2 business days</dd>
      </div>
      <div class="flex gap-4">
        <dt class="text-[var(--text-dim)] min-w-[140px]">timezone</dt>
        <dd class="text-[var(--text-muted)]">EST · UTC-5 (flexible for scheduled calls)</dd>
      </div>
      <div class="flex gap-4">
        <dt class="text-[var(--text-dim)] min-w-[140px]">happy to hear about</dt>
        <dd class="text-[var(--text-muted)]">senior/staff/principal IC roles · full-time or contract · remote or Atlanta metro · interesting technical problems</dd>
      </div>
      <div class="flex gap-4">
        <dt class="text-[var(--text-dim)] min-w-[140px]">please skip</dt>
        <dd class="text-[var(--text-muted)]">cold sales, crypto/web3, mandatory on-site outside Atlanta metro</dd>
      </div>
    </dl>
  </section>
</template>
