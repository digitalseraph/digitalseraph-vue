---
title: HIPAA Behavioral Health SaaS
year: 2019
role: Senior Software Engineer
stack: [PHP, Laravel, Lumen, Docker, AWS CDK, "AWS (Elastic Beanstalk, EC2, RDS, Lambda, S3, CodePipeline, CloudWatch, IAM, Secrets Manager, SQS, SNS)", MySQL]
cover: /og/thrivee.svg
featured: true
summary: AWS DevOps buildout for a HIPAA-compliant behavioral health platform supporting Opioid Use Disorder recovery — multi-account isolation, CI/CD, and CDK-managed infrastructure.
---

Thrivee was building a behavioral-health SaaS platform to support individuals with Opioid Use Disorder — a regulated workload requiring full HIPAA compliance. I led the AWS DevOps buildout from scratch over four months: architecting multi-account isolation, building CI/CD pipelines, provisioning every environment programmatically, and earning HIPAA Security & Privacy certification (H109) along the way.

## Account isolation for regulatory compliance

Health-data workloads benefit from strict blast-radius boundaries. I split the platform across isolated AWS Organization accounts — one per environment (Development, UAT/Staging, Production) — with each account holding its own IAM, VPC, and data plane. No single compromised credential could cross tiers. This also made it trivial to give contractors and auditors scoped access without risking production data.

## CI/CD on AWS-native pipes

I architected CI/CD using AWS CodePipeline and CodeCommit, provisioning Development, UAT/Staging, and Production environments on Elastic Beanstalk and EC2. Every merge to main flowed through build → test → deploy with manual gates between UAT and Production.

## Infrastructure as code

Every piece of AWS infrastructure was defined in an AWS CDK application — VPCs, RDS instances, Secrets Manager entries, S3 buckets with lifecycle policies, CloudWatch alarms, SQS/SNS topics, the works. Reviewable as code, reproducible across accounts. Local Docker and Docker Compose environments mirrored the production topology so a developer could exercise the full system offline.

## Certification

I earned HIPAA Security & Privacy certification (H109) during the engagement and received HiTrust certification training — real credentials, not just compliance-theater documentation.
