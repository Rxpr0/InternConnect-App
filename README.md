# 🌐 InternConnect – Your Gateway to Meaningful Internships

> _A cross-platform mobile application that bridges students and companies through streamlined internship discovery, application tracking, and real-time communication — built with React Native, TypeScript, and Supabase._

[![Built with React Native](https://img.shields.io/badge/-React_Native-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📌 Overview

**InternConnect** is a **capstone senior project** developed by me at Prince Mohammed Bin Fahd University to solve a critical pain point:  
> *Students struggle to find relevant internships, while companies lack efficient ways to discover and evaluate talent.*

It is a **secure, role-based platform** that offers:
- ✅ **Smart internship discovery** (search + filters by role, location, duration, pay)
- ✅ **End-to-end application tracking**
- ✅ **Real-time notifications** (application updates, interview scheduling)
- ✅ **Profile portfolios** for students + company dashboards
- ✅ **Interview scheduling** (in-person or virtual with RSVP & content sharing)

Used by students and companies alike, InternConnect reduces manual effort by **>60%** and creates a transparent, modern internship pipeline.

---

## 🛠 Tech Stack

| Layer        | Technologies |
|--------------|--------------|
| **Frontend** | React Native, TypeScript, Expo, Material UI |
| **Backend**  | Supabase (Auth, Realtime DB, Storage, RLS) |
| **Database** | PostgreSQL (with Row-Level Security) |
| **Auth**     | Email/password + JWT sessions + Role-Based Access (Intern / Company) |
| **File Upload** | PDF resumes only (10MB max), secure URL access |
| **Deployment** | Expo Go (mobile), GitHub CI/CD |
| **Standards** | RESTful APIs, HTTPS, GDPR-compliant data handling |

---

## 🔐 Security & Compliance

We prioritized **enterprise-grade security** from day one:
- 🔒 **Row-Level Security (RLS)** in Supabase: users only access their own data
- ✉️ **Email verification** + **strong password policy**
- 🔄 **Secure session management** with JWT expiration
- 📁 **File validation**: only PDFs allowed, max 10MB
- 🌍 **GDPR-aligned**: user consent, data isolation, privacy controls
- 🛡️ **Input sanitization** & **parameterized queries** to prevent injection

---

## 🧪 Key Features

| Feature | Description |
|--------|-------------|
| **Role-Based Onboarding** | Separate flows for Students & Companies |
| **Smart Search & Filters** | By job title, location, duration (1–3mo, 4–6mo, etc.), remote/hybrid/onsite, paid status |
| **Application Tracking** | Real-time status: *Pending → Approved → Interview → Rejected* |
| **Interview Scheduling** | Choose virtual/in-person, share meeting links, set reminders |
| **Notifications** | Email + in-app alerts for every key event |
| **Profile Completion** | Progress indicators for students (resume, skills, bio) |

---

## 📸 Screenshots

<table>
    <tr>
      <td align="center" style="padding: 10px;">
      <b>Role Selection</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/RoleSelection.jpeg" width="90%" alt="Schedule Interview" />
    </td>
    <td align="center" style="padding: 10px;">
      <b>Registration</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/Registration.jpeg" width="90%" alt="Apply with Resume" />
    </td>
      <td align="center" style="padding: 10px;">
      <b>Intern Dashboard</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/InternDashboard.jpeg" width="90%" alt="Apply with Resume" />
    </td>
  </tr>
  <tr>
     <td align="center" style="padding: 10px;">
      <b>Browse internships</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/BrowseInternships.jpeg" width="90%"  alt="Intern Dashboard" />
    </td>
    <td align="center" style="padding: 10px;">
      <b>Submit Application</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/SubmitApplication.jpeg" width="90%" alt="Company Dashboard" />
    </td>
    <td align="center" style="padding: 10px;">
      <b>Details</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/AppliedIntershipDetails.jpeg" width="90%"  alt="Role Selection" />
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 10px;">
      <b>Company Dashboard</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/CompanyDashboard.jpeg" width="90%" alt="Intern Dashboard" />
    </td>
    <td align="center" style="padding: 10px;">
      <b>Company Profile</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/CompanyProfile.jpeg" width="90%" alt="Internship Details" />
    </td>
    <td align="center" style="padding: 10px;">
      <b>Edit Profile</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/EditProfile.jpeg" width="90%" alt="Company Dashboard" />
    </td>
  </tr>
  <tr>
       <td align="center" style="padding: 10px;">
      <b>Schedule Interview</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/ScheduleInterview.jpeg" width="90%" alt="Company Dashboard" />
    </td>
       <td align="center" style="padding: 10px;">
      <b>Pre Interview</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/PreInterview.jpeg" width="90%" alt="Company Dashboard" />
    </td>
    <td align="center" style="padding: 10px;">
      <b>After Interviewing</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/PostInterview.jpeg" width="90%" alt="Schedule Interview" />
    </td>
  </tr>
     <tr>
     <td align="center" style="padding: 10px;">
      <b>Post Internship</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/PostInernship.jpeg" width="90%" alt="Company Dashboard" />
    </td>
    <td align="center" style="padding: 10px;">
      <b>Notifications</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/Notifications.jpeg" width="90%" alt="Schedule Interview" />
    </td>
    <td align="center" style="padding: 10px;">
      <b>Error Alert</b><br/>
      <img src="https://github.com/Rxpr0/InternConnect-App/blob/main/ErrorAlert.jpeg" width="90%" alt="Company Dashboard" />
    </td>
  </tr>
</table>



