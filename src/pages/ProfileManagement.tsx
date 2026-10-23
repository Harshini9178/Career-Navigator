import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Code,
  FolderGit2,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Star,
  ChevronDown,
  Camera,
  X,
  FileText,
  Sliders,
  Check,
  Building,
  DollarSign,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Save,
  Compass
} from 'lucide-react';
import {
  User,
  ProfileSkillItem,
  ProfileProjectItem,
  ProfileEducationItem,
  ProfileCertificationItem,
  ProfileExperienceItem,
  InterviewPreferences,
  SkillCategory,
  SkillProficiency
} from '../types.js';
import { api } from '../lib/api.js';
import AvatarSelectionModal from '../components/AvatarSelectionModal.js';
import { getAvatarSrc } from '../lib/avatars.js';

interface ProfileProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
  onNavigate?: (view: string, id?: string) => void;
}

const TARGET_ROLE_OPTIONS = [
  'Java Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Software Engineer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Cybersecurity Analyst',
  'QA Engineer',
  'Android Developer',
  'Other'
];

const ENGINEERING_BRANCHES = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Other Specialization'
];

const EXPERIENCE_LEVELS = [
  'Student',
  'Internship',
  'Entry Level',
  'Experienced'
];

const SKILL_CATEGORIES: SkillCategory[] = [
  'Programming Languages',
  'Frameworks',
  'Databases',
  'Developer Tools',
  'Cloud',
  'Other'
];

const PROFICIENCY_LEVELS: SkillProficiency[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
];

const POPULAR_SKILL_PRESETS = [
  { name: 'Java', category: 'Programming Languages' as SkillCategory },
  { name: 'Spring Boot', category: 'Frameworks' as SkillCategory },
  { name: 'SQL', category: 'Databases' as SkillCategory },
  { name: 'React', category: 'Frameworks' as SkillCategory },
  { name: 'JavaScript', category: 'Programming Languages' as SkillCategory },
  { name: 'TypeScript', category: 'Programming Languages' as SkillCategory },
  { name: 'Python', category: 'Programming Languages' as SkillCategory },
  { name: 'Git', category: 'Developer Tools' as SkillCategory },
  { name: 'Docker', category: 'Developer Tools' as SkillCategory },
  { name: 'AWS', category: 'Cloud' as SkillCategory }
];

export default function ProfileManagement({ user, onProfileUpdate, onNavigate }: ProfileProps) {
  // 1. Basic Info State
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [cityState, setCityState] = useState(user.cityState || '');
  const [college, setCollege] = useState(user.college || '');
  const [degree, setDegree] = useState(user.degree || 'B.Tech');
  const [branch, setBranch] = useState(user.branch || 'Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState(user.graduationYear || '2025');
  const [currentSemester, setCurrentSemester] = useState(user.currentSemester || '7th Semester');
  const [linkedIn, setLinkedIn] = useState(user.linkedIn || '');
  const [github, setGithub] = useState(user.github || '');
  const [portfolioWebsite, setPortfolioWebsite] = useState(user.portfolioWebsite || '');
  const [picture, setPicture] = useState(user.picture || '');

  // 2. Career Preferences State
  const [targetRole, setTargetRole] = useState(() => {
    if (!user.targetRole) return 'Full Stack Developer';
    return TARGET_ROLE_OPTIONS.includes(user.targetRole) ? user.targetRole : 'Other';
  });
  const [customRole, setCustomRole] = useState(() => {
    return user.targetRole && !TARGET_ROLE_OPTIONS.includes(user.targetRole) ? user.targetRole : '';
  });
  const [preferredDomains, setPreferredDomains] = useState<string[]>(['FinTech', 'AI/ML']);
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || 'Entry Level');
  const [preferredLocation, setPreferredLocation] = useState(user.preferredLocation || 'Bengaluru, India');
  const [workPreference, setWorkPreference] = useState<'On-site' | 'Hybrid' | 'Remote'>(
    (user.workPreference as any) || 'Hybrid'
  );
  const [expectedSalary, setExpectedSalary] = useState(user.expectedSalary || '');
  const [employmentType, setEmploymentType] = useState<'Full-time' | 'Internship' | 'Contract' | 'Part-time'>(
    (user.employmentType as any) || 'Full-time'
  );
  const [targetCompanies, setTargetCompanies] = useState(user.targetCompanies || '');

  // 3. Skills State
  const [skillsList, setSkillsList] = useState<ProfileSkillItem[]>(() => {
    if (user.skillsDataJson) {
      try {
        const parsed = JSON.parse(user.skillsDataJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    if (user.skills && user.skills.length > 0) {
      return user.skills.map((s) => ({
        name: s,
        category: 'Programming Languages',
        proficiency: 'Intermediate',
        isPrimary: false
      }));
    }
    return [
      { name: 'Java', category: 'Programming Languages', proficiency: 'Advanced', isPrimary: true },
      { name: 'Spring Boot', category: 'Frameworks', proficiency: 'Intermediate', isPrimary: true },
      { name: 'SQL', category: 'Databases', proficiency: 'Advanced', isPrimary: false },
      { name: 'React', category: 'Frameworks', proficiency: 'Intermediate', isPrimary: false }
    ];
  });
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('Programming Languages');
  const [newSkillProficiency, setNewSkillProficiency] = useState<SkillProficiency>('Intermediate');
  const [newSkillIsPrimary, setNewSkillIsPrimary] = useState(false);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<'All' | SkillCategory>('All');

  // 4. Projects State
  const [projectsList, setProjectsList] = useState<ProfileProjectItem[]>(() => {
    if (user.projectsDataJson) {
      try {
        const parsed = JSON.parse(user.projectsDataJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    if (user.projects && user.projects.length > 0) {
      return user.projects.map((title, i) => ({
        id: `proj-${i + 1}`,
        title,
        description: 'Engineered backend and full-stack capabilities with automated deployment.',
        technologies: ['Java', 'Spring Boot', 'SQL'],
        githubUrl: 'https://github.com/example/project',
        liveUrl: '',
        role: 'Lead Developer',
        accomplishments: ['Improved response times by 35% with Redis caching.']
      }));
    }
    return [];
  });
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProfileProjectItem | null>(null);
  const [projectForm, setProjectForm] = useState<Partial<ProfileProjectItem>>({
    title: '',
    description: '',
    technologies: [],
    startDate: '',
    endDate: '',
    githubUrl: '',
    liveUrl: '',
    role: '',
    accomplishments: []
  });
  const [techInput, setTechInput] = useState('');
  const [accomplishmentInput, setAccomplishmentInput] = useState('');
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState<string | null>(null);

  // 5. Education State
  const [educationList, setEducationList] = useState<ProfileEducationItem[]>(() => {
    if (user.educationDataJson) {
      try {
        const parsed = JSON.parse(user.educationDataJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'edu-1',
        institution: user.college || 'National Institute of Technology',
        degree: user.degree || 'B.Tech',
        specialization: user.branch || 'Computer Science & Engineering',
        startYear: '2021',
        graduationYear: user.graduationYear || '2025',
        score: '8.7 CGPA',
        status: 'Pursuing'
      }
    ];
  });
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<ProfileEducationItem | null>(null);
  const [educationForm, setEducationForm] = useState<Partial<ProfileEducationItem>>({
    institution: '',
    degree: 'B.Tech',
    specialization: '',
    startYear: '2021',
    graduationYear: '2025',
    score: '',
    status: 'Pursuing'
  });
  const [deleteConfirmEduId, setDeleteConfirmEduId] = useState<string | null>(null);

  // 6. Certifications & Work Experience (Optional sub-sections)
  const [certificationsList, setCertificationsList] = useState<ProfileCertificationItem[]>(() => {
    if (user.certificationsDataJson) {
      try {
        return JSON.parse(user.certificationsDataJson) || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certForm, setCertForm] = useState<Partial<ProfileCertificationItem>>({
    title: '',
    issuer: '',
    issueDate: '',
    credentialUrl: ''
  });

  const [experienceList, setExperienceList] = useState<ProfileExperienceItem[]>(() => {
    if (user.experienceDataJson) {
      try {
        return JSON.parse(user.experienceDataJson) || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [expForm, setExpForm] = useState<Partial<ProfileExperienceItem>>({
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });

  // 7. Placement Interview Customization State
  const savedInterviewPrefs: InterviewPreferences | null = useMemo(() => {
    if (user.interviewPreferencesJson) {
      try {
        return JSON.parse(user.interviewPreferencesJson);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [user.interviewPreferencesJson]);

  const [interviewRole, setInterviewRole] = useState(
    savedInterviewPrefs?.targetRole || user.targetRole || 'Full Stack Developer'
  );
  const [interviewBranch, setInterviewBranch] = useState(
    savedInterviewPrefs?.branch || user.branch || 'Computer Science & Engineering'
  );
  const [interviewLevel, setInterviewLevel] = useState(
    savedInterviewPrefs?.experienceLevel || user.experienceLevel || 'Entry Level'
  );
  const [interviewDifficulty, setInterviewDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
    savedInterviewPrefs?.difficulty || 'Medium'
  );
  const [interviewFocus, setInterviewFocus] = useState<
    'Technical' | 'HR' | 'Behavioral' | 'System Design' | 'Mixed'
  >(savedInterviewPrefs?.focus || 'Mixed');
  const [interviewCompetencies, setInterviewCompetencies] = useState<string[]>(
    savedInterviewPrefs?.technicalCompetencies || ['Java', 'Spring Boot', 'SQL', 'React']
  );
  const [interviewKeyProjects, setInterviewKeyProjects] = useState<string[]>(
    savedInterviewPrefs?.keyProjects || []
  );
  const [savingInterviewPrefs, setSavingInterviewPrefs] = useState(false);

  // 8. UI & Feedback State
  const [savingProfile, setSavingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Synchronize effective career target role
  const effectiveTargetRole = targetRole === 'Other' ? customRole.trim() : targetRole;

  // Track unsaved changes
  const markDirty = () => {
    if (!hasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // 9. Profile Completion Calculation
  const completionStats = useMemo(() => {
    const checks = [
      {
        id: 'personal',
        label: 'Personal Information',
        completed: Boolean(name && phone && cityState && college && degree && branch && graduationYear),
        weight: 20,
        sectionId: 'section-personal'
      },
      {
        id: 'education',
        label: 'Education History',
        completed: educationList.length > 0,
        weight: 15,
        sectionId: 'section-education'
      },
      {
        id: 'career',
        label: 'Career & Placement Goals',
        completed: Boolean(effectiveTargetRole && workPreference && preferredLocation),
        weight: 20,
        sectionId: 'section-career'
      },
      {
        id: 'skills',
        label: 'Technical Skills (3+ minimum)',
        completed: skillsList.length >= 3,
        weight: 20,
        sectionId: 'section-skills'
      },
      {
        id: 'projects',
        label: 'Projects Undertaken',
        completed: projectsList.length > 0,
        weight: 15,
        sectionId: 'section-projects'
      },
      {
        id: 'links',
        label: 'Professional Links (LinkedIn / GitHub)',
        completed: Boolean(linkedIn || github),
        weight: 10,
        sectionId: 'section-personal'
      }
    ];

    const percentage = checks.reduce((sum, item) => (item.completed ? sum + item.weight : sum), 0);
    const missing = checks.filter((c) => !c.completed);
    return { percentage, checks, missing, isComplete: percentage === 100 };
  }, [
    name,
    phone,
    cityState,
    college,
    degree,
    branch,
    graduationYear,
    educationList,
    effectiveTargetRole,
    workPreference,
    preferredLocation,
    skillsList,
    projectsList,
    linkedIn,
    github
  ]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Full name is required.';
    if (phone && !/^\+?[0-9\s\-()]{7,18}$/.test(phone.trim())) {
      errors.phone = 'Please enter a valid phone number (e.g. +91 9876543210).';
    }
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/i;
    if (linkedIn && !urlPattern.test(linkedIn.trim())) {
      errors.linkedIn = 'Please provide a valid LinkedIn URL.';
    }
    if (github && !urlPattern.test(github.trim())) {
      errors.github = 'Please provide a valid GitHub URL.';
    }
    if (portfolioWebsite && !urlPattern.test(portfolioWebsite.trim())) {
      errors.portfolioWebsite = 'Please provide a valid portfolio website URL.';
    }
    if (targetRole === 'Other' && !customRole.trim()) {
      errors.targetRole = 'Please specify your target career role.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 10. Save Complete Profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      setToastMessage({ type: 'error', text: 'Please review and fix the validation errors below.' });
      return;
    }

    setSavingProfile(true);
    setToastMessage(null);

    try {
      const skillsFlat = skillsList.map((s) => s.name);
      const projectsFlat = projectsList.map((p) => p.title);

      const interviewPrefsObj: InterviewPreferences = {
        targetRole: effectiveTargetRole,
        branch,
        experienceLevel,
        technicalCompetencies: interviewCompetencies.length > 0 ? interviewCompetencies : skillsFlat.slice(0, 5),
        keyProjects: interviewKeyProjects.length > 0 ? interviewKeyProjects : projectsFlat.slice(0, 3),
        difficulty: interviewDifficulty,
        focus: interviewFocus
      };

      const payload = {
        name: name.trim(),
        picture: picture || undefined,
        phone: phone.trim() || undefined,
        cityState: cityState.trim() || undefined,
        college: college.trim() || undefined,
        degree: degree.trim() || undefined,
        branch: branch.trim() || undefined,
        graduationYear: graduationYear.trim() || undefined,
        currentSemester: currentSemester.trim() || undefined,
        linkedIn: linkedIn.trim() || undefined,
        github: github.trim() || undefined,
        portfolioWebsite: portfolioWebsite.trim() || undefined,
        targetRole: effectiveTargetRole,
        experienceLevel,
        preferredLocation: preferredLocation.trim() || undefined,
        workPreference,
        expectedSalary: expectedSalary.trim() || undefined,
        employmentType,
        targetCompanies: targetCompanies.trim() || undefined,
        skills: skillsFlat,
        projects: projectsFlat,
        skillsDataJson: JSON.stringify(skillsList),
        projectsDataJson: JSON.stringify(projectsList),
        educationDataJson: JSON.stringify(educationList),
        certificationsDataJson: JSON.stringify(certificationsList),
        experienceDataJson: JSON.stringify(experienceList),
        interviewPreferencesJson: JSON.stringify(interviewPrefsObj)
      };

      const response = await api.put('/api/profile', payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to update profile.');
      }

      const resData = await response.json();
      const updatedUser = resData.user || resData;
      if (updatedUser) {
        onProfileUpdate(updatedUser);
        setHasUnsavedChanges(false);
        setToastMessage({
          type: 'success',
          text: 'Career Profile & Placement Settings have been successfully saved!'
        });
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage({
        type: 'error',
        text: err.message || 'An error occurred while saving your profile. Please try again.'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // 11. Dedicated Save Interview Preferences Button
  const handleSaveInterviewPreferences = async () => {
    setSavingInterviewPrefs(true);
    try {
      const interviewPrefsObj: InterviewPreferences = {
        targetRole: effectiveTargetRole,
        branch,
        experienceLevel,
        technicalCompetencies: interviewCompetencies,
        keyProjects: interviewKeyProjects,
        difficulty: interviewDifficulty,
        focus: interviewFocus
      };

      const response = await api.put('/api/profile', {
        targetRole: effectiveTargetRole,
        branch,
        experienceLevel,
        interviewPreferencesJson: JSON.stringify(interviewPrefsObj)
      });

      if (!response.ok) {
        throw new Error('Failed to update interview preferences.');
      }

      const data = await response.json();
      if (data.user) onProfileUpdate(data.user);

      setToastMessage({
        type: 'success',
        text: 'Placement Interview Customization preferences saved! Mock Interviews is now calibrated with these parameters.'
      });
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to save interview preferences.'
      });
    } finally {
      setSavingInterviewPrefs(false);
    }
  };

  // 12. Skills Management Handlers
  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newSkillName.trim();
    if (!cleanName) return;

    // Duplicate check (case-insensitive)
    const exists = skillsList.some((s) => s.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      setToastMessage({
        type: 'error',
        text: `Skill "${cleanName}" is already present in your skills list.`
      });
      return;
    }

    const newSkill: ProfileSkillItem = {
      id: `skill-${Date.now()}`,
      name: cleanName,
      category: newSkillCategory,
      proficiency: newSkillProficiency,
      isPrimary: newSkillIsPrimary
    };

    setSkillsList([...skillsList, newSkill]);
    setNewSkillName('');
    setNewSkillIsPrimary(false);
    markDirty();
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkillsList(skillsList.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase()));
    setInterviewCompetencies(interviewCompetencies.filter((s) => s.toLowerCase() !== skillName.toLowerCase()));
    markDirty();
  };

  const handleTogglePrimarySkill = (skillName: string) => {
    setSkillsList(
      skillsList.map((s) => (s.name === skillName ? { ...s, isPrimary: !s.isPrimary } : s))
    );
    markDirty();
  };

  const handleAddPresetSkill = (preset: { name: string; category: SkillCategory }) => {
    const exists = skillsList.some((s) => s.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) return;

    setSkillsList([
      ...skillsList,
      {
        id: `skill-${Date.now()}`,
        name: preset.name,
        category: preset.category,
        proficiency: 'Intermediate',
        isPrimary: false
      }
    ]);
    markDirty();
  };

  // 13. Projects Handlers
  const handleSaveProject = () => {
    if (!projectForm.title?.trim()) {
      setToastMessage({ type: 'error', text: 'Project title is required.' });
      return;
    }

    if (editingProject) {
      setProjectsList(
        projectsList.map((p) =>
          p.id === editingProject.id ? ({ ...p, ...projectForm } as ProfileProjectItem) : p
        )
      );
    } else {
      const newProj: ProfileProjectItem = {
        id: `proj-${Date.now()}`,
        title: projectForm.title.trim(),
        description: projectForm.description || '',
        technologies: projectForm.technologies || [],
        startDate: projectForm.startDate || '',
        endDate: projectForm.endDate || '',
        githubUrl: projectForm.githubUrl || '',
        liveUrl: projectForm.liveUrl || '',
        role: projectForm.role || '',
        accomplishments: projectForm.accomplishments || []
      };
      setProjectsList([...projectsList, newProj]);
    }

    setProjectModalOpen(false);
    setEditingProject(null);
    setProjectForm({});
    markDirty();
  };

  const handleDeleteProject = (id: string) => {
    setProjectsList(projectsList.filter((p) => p.id !== id));
    setDeleteConfirmProjectId(null);
    markDirty();
  };

  // 14. Education Handlers
  const handleSaveEducation = () => {
    if (!educationForm.institution?.trim() || !educationForm.degree?.trim()) {
      setToastMessage({ type: 'error', text: 'Institution and Degree are required.' });
      return;
    }

    if (editingEducation) {
      setEducationList(
        educationList.map((e) =>
          e.id === editingEducation.id ? ({ ...e, ...educationForm } as ProfileEducationItem) : e
        )
      );
    } else {
      const newEdu: ProfileEducationItem = {
        id: `edu-${Date.now()}`,
        institution: educationForm.institution.trim(),
        degree: educationForm.degree.trim(),
        specialization: educationForm.specialization || '',
        startYear: educationForm.startYear || '2021',
        graduationYear: educationForm.graduationYear || '2025',
        score: educationForm.score || '',
        status: (educationForm.status as any) || 'Pursuing'
      };
      setEducationList([...educationList, newEdu]);
    }

    setEducationModalOpen(false);
    setEditingEducation(null);
    setEducationForm({});
    markDirty();
  };

  const handleDeleteEducation = (id: string) => {
    setEducationList(educationList.filter((e) => e.id !== id));
    setDeleteConfirmEduId(null);
    markDirty();
  };

  // 15. Avatar Save Handler (Persists selected cartoon avatar, upload, or URL)
  const handleSaveAvatar = async (newAvatar: string) => {
    setPicture(newAvatar);
    markDirty();
    try {
      const response = await api.put('/api/profile', { picture: newAvatar });
      if (response.ok) {
        const resData = await response.json();
        const updatedUser = resData.user || resData;
        if (updatedUser) {
          onProfileUpdate(updatedUser);
        }
      }
      setToastMessage({
        type: 'success',
        text: 'Profile avatar updated and saved successfully!'
      });
    } catch (err) {
      console.error('Failed to sync avatar with server:', err);
      setToastMessage({
        type: 'info',
        text: 'Profile avatar updated locally. Click "Save Changes" to sync all settings.'
      });
    }
  };

  // 16. Navigate to Resume Builder with Profile Export
  const handleExportToResumeBuilder = () => {
    if (onNavigate) {
      onNavigate('resume-builder');
    }
  };

  const filteredSkills = useMemo(() => {
    if (selectedSkillFilter === 'All') return skillsList;
    return skillsList.filter((s) => s.category === selectedSkillFilter);
  }, [skillsList, selectedSkillFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 text-[var(--text-primary)]">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : toastMessage.type === 'error'
              ? 'bg-red-950/80 border-red-500/40 text-red-300'
              : 'bg-blue-950/80 border-blue-500/40 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>You have unsaved changes. Remember to save your profile before navigating away.</span>
          </div>
          <button
            onClick={() => handleSaveProfile()}
            disabled={savingProfile}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-md transition text-xs flex items-center gap-1.5"
          >
            {savingProfile ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span>Save Now</span>
          </button>
        </div>
      )}

      {/* ==============================================================
          A. PROFILE HEADER SUMMARY CARD
      ============================================================== */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] relative overflow-hidden">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar with Upload Trigger */}
          <div className="relative group shrink-0">
            <img
              src={getAvatarSrc(picture)}
              alt={name || 'Candidate Avatar'}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-blue-500/40 object-cover bg-slate-900 shadow-md group-hover:border-cyan-400 transition"
            />
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl border border-slate-900 shadow-md transition flex items-center justify-center cursor-pointer"
              title="Change Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Details & Meta */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--text-primary)] tracking-tight">
                {name || 'Student Candidate'}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {user.role === 'admin' ? 'Placement Admin' : 'Student Candidate'}
              </span>
              {completionStats.isComplete ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Profile 100% Complete
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {completionStats.percentage}% Completed
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-1 gap-x-4 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </span>
              {phone && (
                <>
                  <span className="text-slate-700 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{phone}</span>
                  </span>
                </>
              )}
              {cityState && (
                <>
                  <span className="text-slate-700 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cityState}</span>
                  </span>
                </>
              )}
              {user.createdAt && (
                <>
                  <span className="text-slate-700 hidden sm:inline">•</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </>
              )}
            </div>

            {/* Quick Badges */}
            <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-slate-300">
                Target: <strong className="text-cyan-400">{effectiveTargetRole}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-slate-300">
                Branch: <strong className="text-slate-200">{branch}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-slate-300">
                Level: <strong className="text-slate-200">{experienceLevel}</strong>
              </span>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleSaveProfile()}
              disabled={savingProfile}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleExportToResumeBuilder}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              title="Launch Resume Builder using profile details"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resume Builder Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==============================================================
          H. PROFILE COMPLETION INDICATOR
      ============================================================== */}
      <div className="glass-card p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Placement Profile Readiness</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Completing your career profile ensures recruiters, AI interviewers, and resume parsers have high-fidelity data.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-sm font-bold text-cyan-400">
            <span>{completionStats.percentage}%</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full"
            style={{ width: `${completionStats.percentage}%` }}
          />
        </div>

        {/* Missing Elements Checklist & Quick Actions */}
        {completionStats.missing.length > 0 ? (
          <div className="pt-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Pending Steps to Reach 100%:
            </span>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {completionStats.missing.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <span className="text-xs text-slate-300 font-medium group-hover:text-cyan-400 transition">
                    + {item.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Outstanding! Your placement profile is 100% complete and fully optimized for campus placements and off-campus opportunities.</span>
          </div>
        )}
      </div>

      {/* ==============================================================
          B. PERSONAL INFORMATION SECTION
      ============================================================== */}
      <div id="section-personal" className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-400" />
              <span>Personal Information</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">Your core contact and academic identification details.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markDirty();
              }}
              placeholder="e.g. Alex Johnson"
              className={`w-full p-2.5 rounded-xl bg-slate-900 border text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition ${
                fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'
              }`}
            />
            {fieldErrors.name && <p className="text-[10px] text-red-400">{fieldErrors.name}</p>}
          </div>

          {/* Email Address (Read-Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Email Address</label>
              <span className="text-[10px] font-mono text-slate-500">Account Primary</span>
            </div>
            <input
              type="email"
              value={user.email}
              readOnly
              disabled
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800/60 text-xs text-slate-400 cursor-not-allowed font-mono"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Phone Number (with Country Code)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                markDirty();
              }}
              placeholder="+91 98765 43210"
              className={`w-full p-2.5 rounded-xl bg-slate-900 border text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition ${
                fieldErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'
              }`}
            />
            {fieldErrors.phone && <p className="text-[10px] text-red-400">{fieldErrors.phone}</p>}
          </div>

          {/* City & State */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">City & State</label>
            <input
              type="text"
              value={cityState}
              onChange={(e) => {
                setCityState(e.target.value);
                markDirty();
              }}
              placeholder="e.g. Bengaluru, Karnataka"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* College / University */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-300">College / University Name</label>
            <input
              type="text"
              value={college}
              onChange={(e) => {
                setCollege(e.target.value);
                markDirty();
              }}
              placeholder="e.g. Indian Institute of Technology / NIT Surathkal"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Degree / Qualification */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Degree / Qualification</label>
            <input
              type="text"
              value={degree}
              onChange={(e) => {
                setDegree(e.target.value);
                markDirty();
              }}
              placeholder="e.g. B.Tech, B.E., M.Tech, MCA, B.Sc"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Branch / Specialization */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Engineering Branch</label>
            <select
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                markDirty();
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
            >
              {ENGINEERING_BRANCHES.map((b) => (
                <option key={b} value={b} className="bg-slate-900 text-slate-100">
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Graduation Year */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Graduation Year</label>
            <select
              value={graduationYear}
              onChange={(e) => {
                setGraduationYear(e.target.value);
                markDirty();
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
            >
              {['2024', '2025', '2026', '2027', '2028', '2029'].map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-slate-100">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Current Academic Year / Semester */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Current Semester / Year</label>
            <input
              type="text"
              value={currentSemester}
              onChange={(e) => {
                setCurrentSemester(e.target.value);
                markDirty();
              }}
              placeholder="e.g. 7th Semester / 4th Year"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* LinkedIn URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5 text-blue-400" />
              <span>LinkedIn Profile URL</span>
            </label>
            <input
              type="url"
              value={linkedIn}
              onChange={(e) => {
                setLinkedIn(e.target.value);
                markDirty();
              }}
              placeholder="https://linkedin.com/in/username"
              className={`w-full p-2.5 rounded-xl bg-slate-900 border text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition ${
                fieldErrors.linkedIn ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'
              }`}
            />
            {fieldErrors.linkedIn && <p className="text-[10px] text-red-400">{fieldErrors.linkedIn}</p>}
          </div>

          {/* GitHub URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-slate-400" />
              <span>GitHub Profile URL</span>
            </label>
            <input
              type="url"
              value={github}
              onChange={(e) => {
                setGithub(e.target.value);
                markDirty();
              }}
              placeholder="https://github.com/username"
              className={`w-full p-2.5 rounded-xl bg-slate-900 border text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition ${
                fieldErrors.github ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'
              }`}
            />
            {fieldErrors.github && <p className="text-[10px] text-red-400">{fieldErrors.github}</p>}
          </div>

          {/* Portfolio Website URL */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Portfolio / Personal Website</span>
            </label>
            <input
              type="url"
              value={portfolioWebsite}
              onChange={(e) => {
                setPortfolioWebsite(e.target.value);
                markDirty();
              }}
              placeholder="https://myportfolio.dev"
              className={`w-full p-2.5 rounded-xl bg-slate-900 border text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition ${
                fieldErrors.portfolioWebsite
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-slate-800 focus:border-blue-500'
              }`}
            />
            {fieldErrors.portfolioWebsite && <p className="text-[10px] text-red-400">{fieldErrors.portfolioWebsite}</p>}
          </div>
        </div>
      </div>

      {/* ==============================================================
          C. CAREER PREFERENCES SECTION
      ============================================================== */}
      <div id="section-career" className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Career Goals & Placement Preferences</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Specify your target roles and preferred work styles to personalize placement recommendations.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Target Role Dropdown */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-bold text-slate-300">
              Target Career Role <span className="text-red-400">*</span>
            </label>
            <select
              value={targetRole}
              onChange={(e) => {
                setTargetRole(e.target.value);
                markDirty();
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 transition"
            >
              {TARGET_ROLE_OPTIONS.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-slate-100">
                  {r}
                </option>
              ))}
            </select>

            {/* Custom Role Input if Other */}
            {targetRole === 'Other' && (
              <div className="pt-2">
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => {
                    setCustomRole(e.target.value);
                    markDirty();
                  }}
                  placeholder="Enter your custom role (e.g. Embedded Firmware Engineer)"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}
          </div>

          {/* Experience Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Experience Profile</label>
            <select
              value={experienceLevel}
              onChange={(e) => {
                setExperienceLevel(e.target.value);
                markDirty();
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 transition"
            >
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl} className="bg-slate-900 text-slate-100">
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Work Preference (On-site, Hybrid, Remote) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Work Preference</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['On-site', 'Hybrid', 'Remote'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setWorkPreference(mode);
                    markDirty();
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    workPreference === mode
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Preferred Job Location</span>
            </label>
            <input
              type="text"
              value={preferredLocation}
              onChange={(e) => {
                setPreferredLocation(e.target.value);
                markDirty();
              }}
              placeholder="e.g. Bengaluru, Hyderabad, Remote, Flexible"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* Preferred Employment Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Employment Type</label>
            <select
              value={employmentType}
              onChange={(e) => {
                setEmploymentType(e.target.value as any);
                markDirty();
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 transition"
            >
              {['Full-time', 'Internship', 'Contract', 'Part-time'].map((type) => (
                <option key={type} value={type} className="bg-slate-900 text-slate-100">
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Salary Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span>Expected Salary Range (Optional)</span>
            </label>
            <input
              type="text"
              value={expectedSalary}
              onChange={(e) => {
                setExpectedSalary(e.target.value);
                markDirty();
              }}
              placeholder="e.g. ₹8 - 14 LPA / $80k - $100k"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* Target Companies */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Companies & Dream Recruiters (Optional)</span>
            </label>
            <input
              type="text"
              value={targetCompanies}
              onChange={(e) => {
                setTargetCompanies(e.target.value);
                markDirty();
              }}
              placeholder="e.g. Google, Microsoft, Amazon, Infosys, Cisco, Atlassian, Early-Stage AI Startups"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>
        </div>
      </div>

      {/* ==============================================================
          D. TECHNICAL SKILLS SECTION
      ============================================================== */}
      <div id="section-skills" className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span>Technical Skills Management</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Curate your technical toolbox with categorized competencies, proficiency levels, and primary tags.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 self-start sm:self-auto bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
            {skillsList.length} Total Skills
          </span>
        </div>

        {/* Quick Add Presets */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Popular Placement In-Demand Skills:
          </span>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SKILL_PRESETS.map((preset) => {
              const alreadyAdded = skillsList.some(
                (s) => s.name.toLowerCase() === preset.name.toLowerCase()
              );
              return (
                <button
                  key={preset.name}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => handleAddPresetSkill(preset)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                    alreadyAdded
                      ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer'
                  }`}
                >
                  {alreadyAdded ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3 text-cyan-400" />}
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Skill Interactive Form */}
        <form onSubmit={handleAddSkill} className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Skill Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Skill / Technology Name</label>
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. Kubernetes, PyTorch, GraphQL"
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Category</label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Proficiency */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Proficiency Level</label>
              <select
                value={newSkillProficiency}
                onChange={(e) => setNewSkillProficiency(e.target.value as SkillProficiency)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {PROFICIENCY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-slate-900 text-slate-100">
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Toggle & Submit Button */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setNewSkillIsPrimary(!newSkillIsPrimary)}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  newSkillIsPrimary
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Mark as primary core skill"
              >
                <Star className={`w-3.5 h-3.5 ${newSkillIsPrimary ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span className="hidden sm:inline">Primary</span>
              </button>

              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs p-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </div>
          </div>
        </form>

        {/* Filter Chips by Category */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-500 mr-1">Filter:</span>
          {(['All', ...SKILL_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedSkillFilter(cat as any)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                selectedSkillFilter === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skills Chips Matrix */}
        {filteredSkills.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
            <Code className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No skills found in this category.</p>
            <p className="text-[11px] text-slate-500">Use the input above or click popular presets to add skills.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {filteredSkills.map((skill) => (
              <div
                key={skill.name}
                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <button
                  type="button"
                  onClick={() => handleTogglePrimarySkill(skill.name)}
                  className="text-slate-500 hover:text-amber-400 transition"
                  title={skill.isPrimary ? 'Core primary skill' : 'Click to mark as core primary skill'}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${skill.isPrimary ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-100">{skill.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                  {skill.proficiency}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">{skill.category}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.name)}
                  className="text-slate-600 hover:text-red-400 transition p-0.5 rounded ml-1"
                  title="Remove skill"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==============================================================
          E. PROJECTS & ACHIEVEMENTS SECTION
      ============================================================== */}
      <div id="section-projects" className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-cyan-400" />
              <span>Projects & Key Accomplishments</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Showcase substantial software engineering projects, contributions, and verified metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingProject(null);
              setProjectForm({
                title: '',
                description: '',
                technologies: [],
                startDate: '',
                endDate: '',
                githubUrl: '',
                liveUrl: '',
                role: '',
                accomplishments: []
              });
              setTechInput('');
              setAccomplishmentInput('');
              setProjectModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>

        {/* Projects Cards List */}
        {projectsList.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
            <FolderGit2 className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-300">No Projects Configured Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Adding software projects highlights your hands-on engineering capabilities to campus recruiters.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setProjectForm({});
                setProjectModalOpen(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              + Add First Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {projectsList.map((project) => (
              <div
                key={project.id}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-100 font-heading">{project.title}</h4>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(project);
                          setProjectForm(project);
                          setTechInput('');
                          setAccomplishmentInput('');
                          setProjectModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-blue-400 p-1 rounded transition"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmProjectId(project.id)}
                        className="text-slate-400 hover:text-red-400 p-1 rounded transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {project.role && (
                    <span className="text-[11px] font-mono text-cyan-400 block">{project.role}</span>
                  )}

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{project.description}</p>

                  {/* Technologies Tags */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.technologies.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Key Accomplishments preview */}
                  {project.accomplishments && project.accomplishments.length > 0 && (
                    <ul className="pt-1 text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                      {project.accomplishments.slice(0, 2).map((acc, i) => (
                        <li key={i} className="line-clamp-1">{acc}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Project Links Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Code</span>
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                  {(project.startDate || project.endDate) && (
                    <span className="text-[10px] text-slate-500">
                      {project.startDate} - {project.endDate || 'Present'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Optional Sub-sections: Certifications & Work Experience Toggle */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Certifications & Industry Credentials ({certificationsList.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setCertForm({ title: '', issuer: '', issueDate: '', credentialUrl: '' });
                setCertModalOpen(true);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Certification</span>
            </button>
          </div>

          {certificationsList.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {certificationsList.map((cert) => (
                <div
                  key={cert.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-200">{cert.title}</h5>
                    <p className="text-[11px] text-slate-400 font-mono">{cert.issuer}</p>
                    {cert.issueDate && <span className="text-[10px] text-slate-500">{cert.issueDate}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCertificationsList(certificationsList.filter((c) => c.id !== cert.id));
                      markDirty();
                    }}
                    className="text-slate-500 hover:text-red-400 p-1"
                    title="Remove certification"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================
          F. EDUCATION SECTION
      ============================================================== */}
      <div id="section-education" className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Education Records</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Add your university degrees, diplomas, high school records, and academic milestones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingEducation(null);
              setEducationForm({
                institution: '',
                degree: 'B.Tech',
                specialization: '',
                startYear: '2021',
                graduationYear: '2025',
                score: '',
                status: 'Pursuing'
              });
              setEducationModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        </div>

        {educationList.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
            <GraduationCap className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No education records added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {educationList.map((edu) => (
              <div
                key={edu.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-100">{edu.institution}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-cyan-400 border border-slate-800">
                      {edu.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {edu.degree} in {edu.specialization || 'Engineering'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>
                      {edu.startYear} - {edu.graduationYear}
                    </span>
                    {edu.score && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{edu.score}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEducation(edu);
                      setEducationForm(edu);
                      setEducationModalOpen(true);
                    }}
                    className="text-slate-400 hover:text-blue-400 p-1.5 rounded transition"
                    title="Edit Record"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmEduId(edu.id)}
                    className="text-slate-400 hover:text-red-400 p-1.5 rounded transition"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==============================================================
          G. PLACEMENT INTERVIEW CUSTOMIZATION SECTION
      ============================================================== */}
      <div id="section-interview" className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Placement Mock Interview Customization</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              These preferences configure the AI evaluation engines in <strong>Mock Interviews</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveInterviewPreferences}
            disabled={savingInterviewPrefs}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            {savingInterviewPrefs ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Interview Preferences</span>
              </>
            )}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Target Interview Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Target Interview Role</label>
            <input
              type="text"
              value={interviewRole}
              onChange={(e) => {
                setInterviewRole(e.target.value);
                markDirty();
              }}
              placeholder="e.g. Java Backend Engineer"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Difficulty Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Preferred Interview Difficulty</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    setInterviewDifficulty(diff);
                    markDirty();
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    interviewDifficulty === diff
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Focus */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Interview Focus</label>
            <select
              value={interviewFocus}
              onChange={(e) => {
                setInterviewFocus(e.target.value as any);
                markDirty();
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 transition"
            >
              <option value="Technical" className="bg-slate-900 text-slate-100">Technical Coding & Concepts</option>
              <option value="System Design" className="bg-slate-900 text-slate-100">System Design & Architecture</option>
              <option value="HR" className="bg-slate-900 text-slate-100">HR & Culture Fit</option>
              <option value="Behavioral" className="bg-slate-900 text-slate-100">Behavioral & STAR Questions</option>
              <option value="Mixed" className="bg-slate-900 text-slate-100">Mixed Placement Comprehensive</option>
            </select>
          </div>

          {/* Core Technical Competencies for Interviews */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-300">
              Key Competencies to Test in Interviews (Comma-separated)
            </label>
            <input
              type="text"
              value={interviewCompetencies.join(', ')}
              onChange={(e) => {
                setInterviewCompetencies(e.target.value.split(',').map((s) => s.trim()).filter(Boolean));
                markDirty();
              }}
              placeholder="Java, Spring Boot, SQL, REST APIs, Microservices"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[10px] text-slate-500 font-mono">
              The AI interviewer will prioritize questions testing these specific technologies.
            </p>
          </div>

          {/* Key Projects for Deep-Dive Questions */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-bold text-slate-300">Key Projects for Deep-Dive Questions</label>
            <input
              type="text"
              value={interviewKeyProjects.join(', ')}
              onChange={(e) => {
                setInterviewKeyProjects(e.target.value.split(',').map((p) => p.trim()).filter(Boolean));
                markDirty();
              }}
              placeholder="E-Commerce API, Distributed Cache"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Global Bottom Save Bar */}
      <div className="sticky bottom-4 z-20 glass-card p-4 rounded-2xl border border-[var(--border)] bg-slate-950/90 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>All updates are safely stored in your secure account database.</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportToResumeBuilder}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Open in Resume Builder</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveProfile()}
            disabled={savingProfile}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            {savingProfile ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Placement Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ==============================================================
          MODALS
      ============================================================== */}

      {/* 1. Avatar Selection & Upload Modal */}
      <AvatarSelectionModal
        isOpen={avatarModalOpen}
        currentAvatar={picture}
        onClose={() => setAvatarModalOpen(false)}
        onSaveAvatar={handleSaveAvatar}
      />

      {/* 2. Project Modal (Add / Edit) */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-heading text-slate-100 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-cyan-400" />
                <span>{editingProject ? 'Edit Project' : 'Add New Project'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setProjectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Project Title *</label>
                <input
                  type="text"
                  value={projectForm.title || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="e.g. Distributed In-Memory Cache"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Role / Contribution</label>
                  <input
                    type="text"
                    value={projectForm.role || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                    placeholder="e.g. Lead Full Stack Developer"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Timeline</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={projectForm.startDate || ''}
                      onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                      placeholder="e.g. Jan 2024"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      value={projectForm.endDate || ''}
                      onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                      placeholder="e.g. May 2024"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Short Description</label>
                <textarea
                  rows={3}
                  value={projectForm.description || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Engineered high-concurrency microservices utilizing Go, Redis, and Docker..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Technologies */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Technologies Used</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (techInput.trim()) {
                          const current = projectForm.technologies || [];
                          if (!current.includes(techInput.trim())) {
                            setProjectForm({ ...projectForm, technologies: [...current, techInput.trim()] });
                          }
                          setTechInput('');
                        }
                      }
                    }}
                    placeholder="Type technology & press Enter (e.g. React, Spring Boot)"
                    className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (techInput.trim()) {
                        const current = projectForm.technologies || [];
                        if (!current.includes(techInput.trim())) {
                          setProjectForm({ ...projectForm, technologies: [...current, techInput.trim()] });
                        }
                        setTechInput('');
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 rounded-xl"
                  >
                    Add
                  </button>
                </div>
                {projectForm.technologies && projectForm.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {projectForm.technologies.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectForm({
                              ...projectForm,
                              technologies: (projectForm.technologies || []).filter((x) => x !== t)
                            });
                          }}
                          className="hover:text-red-400"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Accomplishments */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Key Accomplishments / Metrics</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accomplishmentInput}
                    onChange={(e) => setAccomplishmentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (accomplishmentInput.trim()) {
                          const current = projectForm.accomplishments || [];
                          setProjectForm({ ...projectForm, accomplishments: [...current, accomplishmentInput.trim()] });
                          setAccomplishmentInput('');
                        }
                      }
                    }}
                    placeholder="e.g. Achieved 99.9% uptime and handled 10,000 req/sec"
                    className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (accomplishmentInput.trim()) {
                        const current = projectForm.accomplishments || [];
                        setProjectForm({ ...projectForm, accomplishments: [...current, accomplishmentInput.trim()] });
                        setAccomplishmentInput('');
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 rounded-xl"
                  >
                    Add
                  </button>
                </div>
                {projectForm.accomplishments && projectForm.accomplishments.length > 0 && (
                  <ul className="text-xs text-slate-300 space-y-1 pt-1 list-disc list-inside">
                    {projectForm.accomplishments.map((acc, i) => (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span className="truncate">{acc}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectForm({
                              ...projectForm,
                              accomplishments: (projectForm.accomplishments || []).filter((_, idx) => idx !== i)
                            });
                          }}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={projectForm.githubUrl || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                    placeholder="https://github.com/user/project"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Live Demo URL (Optional)</label>
                  <input
                    type="url"
                    value={projectForm.liveUrl || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                    placeholder="https://myproject.live"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProjectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProject}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                {editingProject ? 'Save Project' : 'Add Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Project Confirmation Modal */}
      {deleteConfirmProjectId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold font-heading text-slate-100">Delete Project Entry?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this project from your profile? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProjectId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProject(deleteConfirmProjectId)}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Education Modal (Add / Edit) */}
      {educationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-heading text-slate-100 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <span>{editingEducation ? 'Edit Education Record' : 'Add Education Record'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEducationModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Institution / University *</label>
                <input
                  type="text"
                  value={educationForm.institution || ''}
                  onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Degree *</label>
                  <input
                    type="text"
                    value={educationForm.degree || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                    placeholder="e.g. B.Tech / M.S."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Specialization</label>
                  <input
                    type="text"
                    value={educationForm.specialization || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, specialization: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Start Year</label>
                  <input
                    type="text"
                    value={educationForm.startYear || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, startYear: e.target.value })}
                    placeholder="2021"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Graduation Year</label>
                  <input
                    type="text"
                    value={educationForm.graduationYear || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, graduationYear: e.target.value })}
                    placeholder="2025"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">CGPA / %</label>
                  <input
                    type="text"
                    value={educationForm.score || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, score: e.target.value })}
                    placeholder="8.8 CGPA"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Pursuing', 'Completed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEducationForm({ ...educationForm, status: st })}
                      className={`py-2 text-xs font-semibold rounded-xl border transition ${
                        educationForm.status === st
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEducationModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEducation}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Education Confirmation Modal */}
      {deleteConfirmEduId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold font-heading text-slate-100">Delete Education Record?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this education entry?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmEduId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEducation(deleteConfirmEduId)}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Certification Modal */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-heading text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Add Certification</span>
              </h3>
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Certification Title *</label>
                <input
                  type="text"
                  value={certForm.title || ''}
                  onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Issuing Organization *</label>
                <input
                  type="text"
                  value={certForm.issuer || ''}
                  onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                  placeholder="e.g. Amazon Web Services / Oracle"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Issue Date</label>
                  <input
                    type="text"
                    value={certForm.issueDate || ''}
                    onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                    placeholder="e.g. Nov 2024"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Credential URL</label>
                  <input
                    type="url"
                    value={certForm.credentialUrl || ''}
                    onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                    placeholder="https://credly.com/..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!certForm.title?.trim() || !certForm.issuer?.trim()) {
                    setToastMessage({ type: 'error', text: 'Title and Issuer are required.' });
                    return;
                  }
                  setCertificationsList([
                    ...certificationsList,
                    {
                      id: `cert-${Date.now()}`,
                      title: certForm.title.trim(),
                      issuer: certForm.issuer.trim(),
                      issueDate: certForm.issueDate || '',
                      credentialUrl: certForm.credentialUrl || ''
                    }
                  ]);
                  setCertModalOpen(false);
                  markDirty();
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Add Certification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
