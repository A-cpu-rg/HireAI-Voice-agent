# HireAI — Voice Agent for Automated Hiring

A full-stack system that uses a Voice AI agent to automate candidate screening workflows — from user interaction to backend decision logic.

---

## Problem

Recruiters spend significant time on initial candidate screening calls:

- Repetitive questions  
- Manual evaluation  
- Delayed feedback loops  

This creates:

- High operational cost  
- Slow hiring cycles  
- Inconsistent evaluation  

---

## Solution

HireAI introduces a **Voice AI agent** that:

- Conducts structured screening conversations  
- Extracts candidate responses  
- Sends data to backend logic for evaluation  
- Returns a decision or summary instantly  

---

## System Flow

User → Web App → Voice Agent → Backend → Response

1. User initiates screening from web app  
2. Voice AI agent interacts with candidate  
3. Responses are processed via API/webhook  
4. Backend evaluates candidate  
5. Result is returned to UI  

---

## Tech Stack

- Frontend: Next.js / React  
- Backend: Node.js / API routes  
- AI Agent: Bolna Voice AI  
- Database: Prisma (SQLite)  
- AI Integration: LLM-based prompt workflows  

---

## Core Features

- Voice-based candidate screening  
- Structured prompt design for consistent evaluation  
- Real-time API integration with backend  
- Automated decision / summary generation  
- End-to-end workflow automation  

---

## Project Objectives (Assignment Mapping)

### 1. Enterprise Use Case
Automating initial hiring interviews using AI voice agents.

### 2. Voice AI Agent
- Built using Bolna  
- Uses structured prompts  
- Integrated via webhook/API  

### 3. Full Stack Web App
- UI to trigger agent  
- Backend to process responses  
- Database to store results  

### 4. End-to-End Flow
User → Agent → Backend → Output fully implemented  

---

## How to Run

```bash
git clone https://github.com/A-cpu-rg/HireAI-Voice-agent.git
cd HireAI-Voice-agent

npm install
npm run dev
