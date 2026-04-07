import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import PaywallPage from "@/pages/PaywallPage";
import DashboardPage from "@/pages/DashboardPage";
import ExamsListPage from "@/pages/ExamsListPage";
import NewExamPage from "@/pages/NewExamPage";
import ExamDetailPage from "@/pages/ExamDetailPage";
import MindMapPage from "@/pages/MindMapPage";
import NotebookPage from "@/pages/NotebookPage";
import StudyNotePage from "@/pages/StudyNotePage";
import ReviewPage from "@/pages/ReviewPage";
import StatsPage from "@/pages/StatsPage";
import EssaysPage from "@/pages/EssaysPage";
import GoalsPage from "@/pages/GoalsPage";
import AdminPage from "@/pages/AdminPage";
import InfluencerDashboardPage from "@/pages/InfluencerDashboardPage";
import ReferralPage from "@/pages/ReferralPage";
import ProfilePage from "@/pages/ProfilePage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/paywall" element={<PaywallPage />} />
              <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
              <Route path="/exams" element={<ProtectedLayout><ExamsListPage /></ProtectedLayout>} />
              <Route path="/exams/new" element={<ProtectedLayout><NewExamPage /></ProtectedLayout>} />
              <Route path="/exams/:id" element={<ProtectedLayout><ExamDetailPage /></ProtectedLayout>} />
              <Route path="/exams/:id/mindmap" element={<ProtectedLayout><MindMapPage /></ProtectedLayout>} />
              <Route path="/exams/:id/essays" element={<ProtectedLayout><EssaysPage /></ProtectedLayout>} />
              <Route path="/notebooks/:id" element={<ProtectedLayout><NotebookPage /></ProtectedLayout>} />
              <Route path="/notes/:id" element={<ProtectedLayout><StudyNotePage /></ProtectedLayout>} />
              <Route path="/review" element={<ProtectedLayout><ReviewPage /></ProtectedLayout>} />
              <Route path="/goals" element={<ProtectedLayout><GoalsPage /></ProtectedLayout>} />
              <Route path="/stats" element={<ProtectedLayout><StatsPage /></ProtectedLayout>} />
              <Route path="/admin" element={<ProtectedLayout><AdminPage /></ProtectedLayout>} />
              <Route path="/influencer" element={<ProtectedLayout><InfluencerDashboardPage /></ProtectedLayout>} />
              <Route path="/referral" element={<ProtectedLayout><ReferralPage /></ProtectedLayout>} />
              <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
