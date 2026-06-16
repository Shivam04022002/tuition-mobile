import { useState, useCallback, useRef } from 'react';
import { requirementService, RequirementFormData, RequirementRecord } from '../services/requirementService';

// ── Draft storage shim ────────────────────────────────────────────────────────
// Uses @react-native-async-storage/async-storage when available,
// falls back to a simple in-process Map so there is no hard dependency.

let _AsyncStorage: {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
} | null = null;

const _memStore = new Map<string, string>();
const _fallback = {
  setItem: async (k: string, v: string) => { _memStore.set(k, v); },
  getItem: async (k: string) => _memStore.get(k) ?? null,
  removeItem: async (k: string) => { _memStore.delete(k); },
};

function getStorage() {
  if (_AsyncStorage) return _AsyncStorage;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return _AsyncStorage!;
  } catch (_) {
    return _fallback;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FormErrors {
  studentName?: string;
  grade?: string;
  board?: string;
  subjects?: string;
  tuitionType?: string;
  budgetMax?: string;
  general?: string;
}

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface UseRequirementFormResult {
  formData: RequirementFormData;
  errors: FormErrors;
  submitStatus: SubmitStatus;
  isDirty: boolean;
  setField: <K extends keyof RequirementFormData>(key: K, value: RequirementFormData[K]) => void;
  toggleSubject: (subject: string) => void;
  toggleDay: (day: string) => void;
  toggleTiming: (timing: string) => void;
  validate: () => boolean;
  submit: () => Promise<RequirementRecord | null>;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  clearDraft: () => Promise<void>;
  reset: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'req_draft_v1';

export const EMPTY_FORM: RequirementFormData = {
  studentName: '',
  grade: '',
  board: '',
  subjects: [],
  tuitionType: 'home',
  address: '',
  city: '',
  state: '',
  pincode: '',
  budgetMin: '0',
  budgetMax: '',
  preferredDays: [],
  preferredTimings: [],
  notes: '',
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useRequirementForm
 *
 * Manages the entire lifecycle of the requirement creation / edit form:
 *  - Field state
 *  - Validation
 *  - Draft persistence (AsyncStorage)
 *  - API submission (create or update)
 */
export function useRequirementForm(
  token: string | null,
  initialData?: Partial<RequirementFormData>,
  editId?: string,
): UseRequirementFormResult {
  const [formData, setFormData] = useState<RequirementFormData>({
    ...EMPTY_FORM,
    ...(initialData || {}),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [isDirty, setIsDirty] = useState(false);

  const isSubmitting = useRef(false);

  // ── Field helpers ───────────────────────────────────────────────────────────

  const setField = useCallback(<K extends keyof RequirementFormData>(
    key: K,
    value: RequirementFormData[K],
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setErrors(prev => {
      if (prev[key as keyof FormErrors]) {
        const next = { ...prev };
        delete next[key as keyof FormErrors];
        return next;
      }
      return prev;
    });
  }, []);

  const toggleSubject = useCallback((subject: string) => {
    setFormData(prev => {
      const already = prev.subjects.includes(subject);
      return {
        ...prev,
        subjects: already
          ? prev.subjects.filter(s => s !== subject)
          : [...prev.subjects, subject],
      };
    });
    setIsDirty(true);
    setErrors(prev => {
      const next = { ...prev };
      delete next.subjects;
      return next;
    });
  }, []);

  const toggleDay = useCallback((day: string) => {
    setFormData(prev => {
      const already = prev.preferredDays.includes(day);
      return {
        ...prev,
        preferredDays: already
          ? prev.preferredDays.filter(d => d !== day)
          : [...prev.preferredDays, day],
      };
    });
    setIsDirty(true);
  }, []);

  const toggleTiming = useCallback((timing: string) => {
    setFormData(prev => {
      const already = prev.preferredTimings.includes(timing);
      return {
        ...prev,
        preferredTimings: already
          ? prev.preferredTimings.filter(t => t !== timing)
          : [...prev.preferredTimings, timing],
      };
    });
    setIsDirty(true);
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    if (!formData.studentName.trim()) {
      errs.studentName = 'Student name is required';
    }
    if (!formData.grade.trim()) {
      errs.grade = 'Class / Grade is required';
    }
    if (!formData.board.trim()) {
      errs.board = 'Board is required';
    }
    if (formData.subjects.length === 0) {
      errs.subjects = 'At least one subject is required';
    }
    if (!formData.tuitionType) {
      errs.tuitionType = 'Tuition mode is required';
    }
    if (!formData.budgetMax || parseInt(formData.budgetMax, 10) <= 0) {
      errs.budgetMax = 'Monthly budget is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData]);

  // ── Draft persistence ───────────────────────────────────────────────────────

  const saveDraft = useCallback(async () => {
    try {
      await getStorage().setItem(DRAFT_KEY, JSON.stringify(formData));
    } catch (_) {}
  }, [formData]);

  const loadDraft = useCallback(async () => {
    try {
      const raw = await getStorage().getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as RequirementFormData;
        setFormData(prev => ({ ...prev, ...draft }));
        setIsDirty(false);
      }
    } catch (_) {}
  }, []);

  const clearDraft = useCallback(async () => {
    try {
      await getStorage().removeItem(DRAFT_KEY);
    } catch (_) {}
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const submit = useCallback(async (): Promise<RequirementRecord | null> => {
    if (isSubmitting.current) return null;
    if (!token) {
      setErrors({ general: 'Authentication required. Please login again.' });
      return null;
    }
    if (!validate()) return null;

    isSubmitting.current = true;
    setSubmitStatus('submitting');
    setErrors({});

    try {
      let result: RequirementRecord;
      if (editId) {
        const res = await requirementService.updateRequirement(token, editId, formData);
        result = res.requirement;
      } else {
        const res = await requirementService.createRequirement(token, formData);
        result = res.requirement;
      }

      await clearDraft();
      setSubmitStatus('success');
      setIsDirty(false);
      return result;
    } catch (err: any) {
      const msg =
        err?.message === 'Unauthorized'
          ? 'Session expired. Please login again.'
          : err?.message || 'Failed to submit requirement. Please try again.';
      setErrors({ general: msg });
      setSubmitStatus('error');
      return null;
    } finally {
      isSubmitting.current = false;
    }
  }, [token, formData, editId, validate, clearDraft]);

  // ── Reset ───────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setFormData({ ...EMPTY_FORM, ...(initialData || {}) });
    setErrors({});
    setSubmitStatus('idle');
    setIsDirty(false);
  }, [initialData]);

  return {
    formData,
    errors,
    submitStatus,
    isDirty,
    setField,
    toggleSubject,
    toggleDay,
    toggleTiming,
    validate,
    submit,
    saveDraft,
    loadDraft,
    clearDraft,
    reset,
  };
}
