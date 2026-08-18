from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PersonalInfo(BaseModel):
    fullName: str = "YOUR FULL NAME"
    jobTitle: str = "Professional Title"
    phone: str = ""
    email: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""

class ResumeSection(BaseModel):
    id: str
    type: str
    title: str
    visible: bool = True
    contentHtml: str
    pageBreakBefore: Optional[bool] = None
    structuredData: Optional[Dict[str, Any]] = None

class Margins(BaseModel):
    top: float = 0.5
    bottom: float = 0.5
    left: float = 0.5
    right: float = 0.5

class Typography(BaseModel):
    fontFamily: str = "Inter"
    fontSize: float = 10.0
    lineHeight: float = 1.25
    headingScale: float = 1.15

class Theme(BaseModel):
    template: str = "modern"
    primaryColor: str = "#1e293b"
    accentColor: str = "#0d9488"
    textColor: str = "#1e293b"
    headingColor: str = "#0f172a"

class PageSettings(BaseModel):
    paperSize: str = "a4"
    orientation: str = "portrait"
    margins: Margins = Field(default_factory=Margins)
    typography: Typography = Field(default_factory=Typography)
    theme: Theme = Field(default_factory=Theme)
    columns: int = 1
    pageLimit: str = "unlimited"
    autoCompress: bool = False

class ResumeData(BaseModel):
    personalInfo: PersonalInfo
    sections: List[ResumeSection]
    pageSettings: PageSettings = Field(default_factory=PageSettings)

class AIRewriteRequest(BaseModel):
    sectionType: str
    sectionTitle: str
    currentContent: str
    actionId: Optional[str] = "results_driven"
    customPrompt: Optional[str] = None
    targetJobDescription: Optional[str] = None
    apiKey: Optional[str] = None

class EditorAgentPlan(BaseModel):
    intent: str
    factsPreserved: List[str]
    actionSteps: List[str]

class AIRewriteResponse(BaseModel):
    id: str
    sectionId: str
    actionTitle: str
    originalText: str
    suggestedText: str
    explanation: str
    metricsAdded: List[str]
    applied: bool = False
    editorAgentPlan: EditorAgentPlan

class ATSScoreRequest(BaseModel):
    resumeData: ResumeData
    targetJobDescription: Optional[str] = None

class ResumeSourceItem(BaseModel):
    content: str
    filename: str = "resume.pdf"
    isPrimary: bool = False
    parsedData: Optional[ResumeData] = None

class JobDescriptionInput(BaseModel):
    text: str = ""
    customKeywords: Optional[List[str]] = None

class MergeOptions(BaseModel):
    preservePrimaryStructure: bool = True
    maxBulletsPerExperience: int = 6
    preferredTone: str = "professional"

class ResumeMergeRequest(BaseModel):
    primaryResume: ResumeSourceItem
    secondaryResumes: List[ResumeSourceItem] = []
    jobDescription: Optional[JobDescriptionInput] = None
    mode: str = "merge_with_jd" # "single_with_jd" | "merge_with_jd" | "merge_only"
    options: Optional[MergeOptions] = None
    apiKey: Optional[str] = None

class MergeMetadata(BaseModel):
    mode: str
    sourcesAnalyzed: int
    sectionsMerged: List[str]
    deduplicationCount: int
    newAchievementsAdded: int
    jdMatchScore: Optional[float] = None
    skillGaps: List[str] = []
    suggestedAdditions: List[str] = []
    mustHaveKeywordsFound: List[str] = []
    missingKeywords: List[str] = []

class ResumeMergeResponse(BaseModel):
    mergedResume: ResumeData
    mergeMetadata: MergeMetadata
    changesLog: List[str]

class GenerateJDRequest(BaseModel):
    rolePrompt: str
    apiKey: Optional[str] = None

class GenerateJDResponse(BaseModel):
    text: str
    keywords: List[str] = []
    mustHave: List[str] = []
    preferred: List[str] = []

