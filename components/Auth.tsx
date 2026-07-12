import React, { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import {
  getSession, onAuthStateChange, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut,
  getMyHouseholdMember, createHousehold, joinHousehold, getHouseholdInviteCode, HouseholdMemberRow,
} from '../services/authService';
import { buildHouseholdContext, HouseholdContext } from '../services/syncService';

interface AuthGateProps {
  onReady: (ctx: HouseholdContext, isFreshHousehold: boolean) => void;
}

type Stage = 'LOADING' | 'SIGNED_OUT' | 'CHECK_EMAIL' | 'ONBOARDING' | 'INVITE_SHOWN' | 'DONE';

const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-wealth-border text-sm bg-white text-wealth-text placeholder:text-wealth-muted';
const primaryBtn = 'w-full py-2.5 rounded-lg bg-wealth-emerald text-white text-sm font-bold uppercase tracking-wide disabled:opacity-50';

const AuthGate: React.FC<AuthGateProps> = ({ onReady }) => {
  const [stage, setStage] = useState<Stage>('LOADING');
  const [mode, setMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [householdMode, setHouseholdMode] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [householdName, setHouseholdName] = useState('Our Household');
  const [inviteCode, setInviteCode] = useState('');
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [pendingReady, setPendingReady] = useState<{ ctx: HouseholdContext; isFresh: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;

    const resolveMember = async () => {
      const member = await getMyHouseholdMember();
      if (!mounted) return;
      if (member) {
        const ctx = await buildHouseholdContext(member);
        if (!mounted) return;
        onReady(ctx, false);
        setStage('DONE');
      } else {
        setStage('ONBOARDING');
      }
    };

    (async () => {
      const session = await getSession();
      if (!mounted) return;
      if (session) await resolveMember(); else setStage('SIGNED_OUT');
    })();

    const sub = onAuthStateChange((session) => {
      if (!mounted) return;
      if (session) resolveMember(); else setStage('SIGNED_OUT');
    });

    return () => { mounted = false; sub.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === 'SIGN_UP') {
        const { session } = await signUpWithEmail(email, password);
        if (!session) { setStage('CHECK_EMAIL'); return; }
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const member: HouseholdMemberRow = householdMode === 'CREATE'
        ? await createHousehold(householdName, displayName)
        : await joinHousehold(inviteCode, displayName);
      const ctx = await buildHouseholdContext(member);

      if (householdMode === 'CREATE') {
        const code = await getHouseholdInviteCode(ctx.householdId);
        setCreatedInviteCode(code);
        setPendingReady({ ctx, isFresh: true });
        setStage('INVITE_SHOWN');
      } else {
        onReady(ctx, false);
        setStage('DONE');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const continueToApp = () => {
    if (pendingReady) {
      onReady(pendingReady.ctx, pendingReady.isFresh);
      setStage('DONE');
    }
  };

  if (stage === 'LOADING' || stage === 'DONE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wealth-bg">
        <Loader2 className="animate-spin text-wealth-emerald" size={28} />
      </div>
    );
  }

  if (stage === 'CHECK_EMAIL') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wealth-bg p-6">
        <div className="max-w-sm w-full bg-wealth-panel border border-wealth-border rounded-2xl p-8 shadow-sm text-center">
          <h1 className="text-xl font-display font-bold text-wealth-text mb-2">Check your email</h1>
          <p className="text-sm text-wealth-muted">We sent a confirmation link to {email}. Open it, then come back and sign in.</p>
          <button onClick={() => { setStage('SIGNED_OUT'); setMode('SIGN_IN'); }} className="mt-6 text-xs text-wealth-muted underline">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'SIGNED_OUT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wealth-bg p-6">
        <div className="max-w-sm w-full bg-wealth-panel border border-wealth-border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-display font-bold text-wealth-text mb-1">Duo</h1>
          <p className="text-sm text-wealth-muted mb-6">One number that moves, together.</p>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            {error && <p className="text-xs text-wealth-danger">{error}</p>}
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? 'Please wait…' : mode === 'SIGN_IN' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <button onClick={() => signInWithGoogle()} className="w-full mt-3 py-2.5 rounded-lg border border-wealth-border text-sm font-medium text-wealth-text">
            Continue with Google
          </button>

          <button onClick={() => setMode(mode === 'SIGN_IN' ? 'SIGN_UP' : 'SIGN_IN')} className="w-full mt-4 text-xs text-wealth-muted underline">
            {mode === 'SIGN_IN' ? "New here? Create an account" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'INVITE_SHOWN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wealth-bg p-6">
        <div className="max-w-sm w-full bg-wealth-panel border border-wealth-border rounded-2xl p-8 shadow-sm text-center">
          <Users className="text-wealth-emerald mx-auto mb-3" size={24} />
          <h1 className="text-xl font-display font-bold text-wealth-text mb-1">Household created</h1>
          <p className="text-sm text-wealth-muted mb-4">Share this code with your partner so they can join:</p>
          <p className="text-2xl font-mono font-bold tracking-widest text-wealth-emerald mb-6">{createdInviteCode}</p>
          <button onClick={continueToApp} className={primaryBtn}>Continue</button>
        </div>
      </div>
    );
  }

  // ONBOARDING
  return (
    <div className="min-h-screen flex items-center justify-center bg-wealth-bg p-6">
      <div className="max-w-sm w-full bg-wealth-panel border border-wealth-border rounded-2xl p-8 shadow-sm">
        <Users className="text-wealth-emerald mb-3" size={24} />
        <h1 className="text-xl font-display font-bold text-wealth-text mb-1">Set up your household</h1>
        <p className="text-sm text-wealth-muted mb-6">Create a new household, or join your partner's with their invite code.</p>

        <form onSubmit={handleOnboardingSubmit} className="space-y-3">
          <input required placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />

          <div className="flex gap-2">
            <button type="button" onClick={() => setHouseholdMode('CREATE')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${householdMode === 'CREATE' ? 'bg-wealth-emerald text-white' : 'border border-wealth-border text-wealth-text'}`}>
              Create household
            </button>
            <button type="button" onClick={() => setHouseholdMode('JOIN')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${householdMode === 'JOIN' ? 'bg-wealth-emerald text-white' : 'border border-wealth-border text-wealth-text'}`}>
              Join with code
            </button>
          </div>

          {householdMode === 'CREATE' ? (
            <input placeholder="Household name" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} className={inputClass} />
          ) : (
            <input required placeholder="Invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className={inputClass} />
          )}

          {error && <p className="text-xs text-wealth-danger">{error}</p>}
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy ? 'Please wait…' : 'Continue'}
          </button>
        </form>

        <button onClick={() => signOut()} className="w-full mt-4 text-xs text-wealth-muted underline">Sign out</button>
      </div>
    </div>
  );
};

export default AuthGate;
