import { toAppError } from '../errors';
import { supabase } from '../supabase';
import type { Course, Grade } from '../types';

/** Certificates, the no-account taste, reports and the admin queues (M5). Rules live in Postgres. */

export interface VerifiedCertificate {
  display_name: string;
  course_title: string;
  island_name: string;
  guardian: Course['guardian'];
  issued_at: string;
  lessons: number;
}

export async function claimCertificate(courseId: string): Promise<string> {
  const { data, error } = await supabase().rpc('claim_certificate', { p_course: courseId });
  if (error) throw toAppError(error);
  return data as string;
}

/** Anyone (signed in or not) can check a code. Null when the code doesn't exist. */
export async function verifyCertificate(code: string): Promise<VerifiedCertificate | null> {
  const { data, error } = await supabase().rpc('verify_certificate', { p_code: code });
  if (error) throw toAppError(error);
  return ((data as VerifiedCertificate[])[0] ?? null) as VerifiedCertificate | null;
}

export interface MyCertificate {
  code: string;
  issued_at: string;
  course: { title: string; island_name: string; guardian: Course['guardian'] };
}

export async function myCertificates(): Promise<MyCertificate[]> {
  const { data, error } = await supabase()
    .from('certificates')
    .select('code, issued_at, course:courses(title, island_name, guardian)')
    .order('issued_at', { ascending: false });
  if (error) throw toAppError(error);
  return data as unknown as MyCertificate[];
}

/** Grade a first-unit question without an account; nothing is saved. */
export async function tasteCheck(questionId: string, choice: number): Promise<Grade> {
  const { data, error } = await supabase()
    .rpc('taste_check', { p_question: questionId, p_choice: choice })
    .single();
  if (error) throw toAppError(error);
  return data as Grade;
}

export type ReportCategory = 'integrity' | 'wellbeing' | 'abuse' | 'off_topic' | 'other';

export async function reportContent(
  questionId: string,
  category: ReportCategory,
  note: string,
): Promise<void> {
  const { error } = await supabase().rpc('report_content', {
    p_question: questionId,
    p_category: category,
    p_note: note,
  });
  if (error) throw toAppError(error);
}

export interface Flag {
  id: string;
  category: ReportCategory;
  learner_text: string;
  wisp_text: string;
  status: 'open' | 'approved' | 'adjusted' | 'escalated';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  question_id: string | null;
  course: { id: string; title: string; island_name: string } | null;
  reporter: { display_name: string; handle: string } | null;
}

export async function listFlags(): Promise<Flag[]> {
  const { data, error } = await supabase()
    .from('wisp_flags')
    .select(
      'id, category, learner_text, wisp_text, status, admin_note, created_at, reviewed_at, question_id, course:courses(id, title, island_name), reporter:profiles!wisp_flags_user_id_fkey(display_name, handle)',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw toAppError(error);
  return data as unknown as Flag[];
}

export async function reviewFlag(
  id: string,
  status: Exclude<Flag['status'], 'open'>,
  note: string,
): Promise<void> {
  const { error } = await supabase().rpc('review_flag', {
    p_flag: id,
    p_status: status,
    p_note: note,
  });
  if (error) throw toAppError(error);
}

export interface ReviewItemCourse {
  id: string;
  title: string;
  island_name: string;
  guardian: Course['guardian'];
  updated_at: string;
  owner: { display_name: string } | null;
}

export async function coursesInReview(): Promise<ReviewItemCourse[]> {
  const { data, error } = await supabase()
    .from('courses')
    .select(
      'id, title, island_name, guardian, updated_at, owner:profiles!courses_owner_id_fkey(display_name)',
    )
    .eq('status', 'in_review')
    .is('deleted_at', null)
    .order('updated_at');
  if (error) throw toAppError(error);
  return data as unknown as ReviewItemCourse[];
}

export interface AuditEntry {
  id: number;
  action: string;
  target: string;
  details: Record<string, unknown>;
  created_at: string;
  actor: { display_name: string } | null;
}

export async function recentActivity(): Promise<AuditEntry[]> {
  const { data, error } = await supabase()
    .from('audit_log')
    .select(
      'id, action, target, details, created_at, actor:profiles!audit_log_actor_id_fkey(display_name)',
    )
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw toAppError(error);
  return data as unknown as AuditEntry[];
}
