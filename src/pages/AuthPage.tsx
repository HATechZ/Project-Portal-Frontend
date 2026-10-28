import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { countries, getCountryShortName } from '@/constants/countries';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiClientError } from '@/services/apiClient';
import { login } from '@/services/authService';
import { persistUser } from '@/services/authSession';
import { getCompanyTypes, signupCompany } from '@/services/companyService';

type AuthScreen = 'company-signup' | 'login' | 'set-password' | 'all';

type AuthPageProps = {
  screen: AuthScreen;
};

type FieldProps = {
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  helper?: string;
  readOnly?: boolean;
  short?: boolean;
  mono?: boolean;
  error?: boolean;
  required?: boolean;
};

function Field({
  label,
  defaultValue,
  value,
  onChange,
  placeholder,
  type = 'text',
  helper,
  readOnly,
  short,
  mono,
  error,
  required,
}: FieldProps) {
  return (
    <div className="auth-field">
      <label>{label}</label>
      <input
        className={[short && 'auth-input--short', mono && 'auth-input--mono', error && 'auth-input--error']
          .filter(Boolean)
          .join(' ')}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        type={type}
        readOnly={readOnly}
        required={required}
      />
      {helper ? <span className="auth-helper">{helper}</span> : null}
    </div>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label>{label}</label>
      <div className="auth-password-field">
        <input value={value} onChange={(event) => onChange(event.target.value)} type={visible ? 'text' : 'password'} required />
        <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((current) => !current)}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function AuthBrand({ tenant = false, message }: { tenant?: boolean; message: string }) {
  return (
    <div className="auth-brand-panel">
      <div>
        {tenant ? (
          <div className="auth-tenant-brand">
            <div className="auth-logo-slot">Logo</div>
            <div>
              <strong>Tech Marine Solutions Ltd</strong>
              <span>TMS - techmarine.projectportal.app</span>
            </div>
          </div>
        ) : (
          <>
            <div className="auth-monogram">PP</div>
            <h2>Project Portal</h2>
            <p className="auth-brand-kicker">Workflow Management</p>
          </>
        )}
        <p className="auth-brand-copy">{message}</p>
        {!tenant ? null : <p className="auth-brand-muted">Powered by Project Portal Workflow Management.</p>}
      </div>
      <div>
        <div className="auth-brand-divider" />
        <p className="auth-brand-footer">&copy; 2026 Project Portal Workflow Management. All rights reserved. | HATechZ</p>
      </div>
    </div>
  );
}

function FormStateCards({ submitText, loadingText, successText, errorLabel, errorText }: {
  submitText: string;
  loadingText: string;
  successText: string;
  errorLabel: string;
  errorText: string;
}) {
  return (
    <div className="auth-state-grid">
      <div className="auth-state-card">
        <p>Field-level error</p>
        <Field label={errorLabel} type="password" defaultValue={errorLabel.includes('Confirm') ? 'OceanRig!48x' : undefined} error />
        <span className="auth-error-text">{errorText}</span>
      </div>
      <div className="auth-state-card">
        <p>Form-level error</p>
        <div className="auth-alert auth-alert--error">{errorText}</div>
        <button className="auth-submit" type="button">{submitText}</button>
      </div>
      <div className="auth-state-card">
        <p>Loading / submitting</p>
        <button className="auth-submit auth-submit--loading" type="button">
          <span className="auth-spinner" />
          {loadingText}
        </button>
      </div>
      <div className="auth-state-card">
        <p>Success / redirect</p>
        <div className="auth-alert auth-alert--success">
          <span />
          {successText}
        </div>
      </div>
    </div>
  );
}

function AuthFrame({ number, title, description, children }: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="auth-screen">
      <div className="auth-screen-label">{number} - {title}</div>
      <p className="auth-screen-description">{description}</p>
      {children}
    </section>
  );
}

function AuthContentFrame({ children }: { children: ReactNode }) {
  return <section className="auth-screen auth-screen--single">{children}</section>;
}

function CompanySignupScreen({ showReference = false }: { showReference?: boolean }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '',
    abbr: '',
    companyTypeId: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    countryCode: '+880',
    phone: '',
    termsAccepted: true,
  });

  const companyTypesQuery = useQuery({
    queryKey: ['company-types'],
    queryFn: getCompanyTypes,
  });

  const signupMutation = useMutation({
    mutationFn: signupCompany,
    onSuccess: () => {
      toast.success('Company account created successfully.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const updateForm = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateCountry = (name: string) => {
    const country = countries.find((item) => item.name === name);
    setForm((current) => ({ ...current, country: name, countryCode: country?.code ?? current.countryCode }));
  };

  const errorMessage = getApiErrorMessage(signupMutation.error);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signupMutation.mutate({
      company: {
        name: form.companyName,
        abbr: form.abbr,
        companyTypeId: form.companyTypeId,
      },
      admin: {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        country: form.country,
        phone: `${form.countryCode} ${form.phone}`,
      },
      termsAccepted: form.termsAccepted,
    });
  };

  return (
    <>
      <div className="auth-card">
        <div className="auth-form-panel">
          <p className="auth-eyebrow">Company Sign-Up</p>
          <h1>Create your company workspace</h1>
          <p className="auth-intro">Set up your organization and admin account to start managing project documents and workflows.</p>
          <form className="auth-form-stack" onSubmit={handleSubmit}>
            {errorMessage ? <div className="auth-alert auth-alert--error">{errorMessage}</div> : null}
            <Field
              label="Company name"
              value={form.companyName}
              onChange={(value) => updateForm('companyName', value)}
              placeholder="Tech Marine Solutions Ltd"
              required
            />
            <div className="auth-form-row">
              <Field
                label="Short name / abbreviation"
                value={form.abbr}
                onChange={(value) => updateForm('abbr', value)}
                placeholder="TMS"
                helper="Used in project codes"
                mono
                required
              />
              <div className="auth-field">
                <label>Company type</label>
                <select
                  value={form.companyTypeId}
                  onChange={(event) => updateForm('companyTypeId', event.target.value)}
                  disabled={companyTypesQuery.isLoading}
                  required
                >
                  <option value="">{companyTypesQuery.isLoading ? 'Loading company types...' : 'Select company type'}</option>
                  {companyTypesQuery.data?.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {companyTypesQuery.isError ? <span className="auth-helper">Could not load company types.</span> : null}
              </div>
            </div>
            <div className="auth-divider" />
            <Field
              label="Admin full name"
              value={form.fullName}
              onChange={(value) => updateForm('fullName', value)}
              placeholder="Nayeem Rahman"
              required
            />
            <Field
              label="Admin work email"
              type="email"
              value={form.email}
              onChange={(value) => updateForm('email', value)}
              placeholder="nayeem@techmarine.com"
              required
            />
            <PasswordField label="Password" value={form.password} onChange={(value) => updateForm('password', value)} />
            <PasswordField label="Confirm password" value={form.confirmPassword} onChange={(value) => updateForm('confirmPassword', value)} />
            <div className="auth-field">
              <label>Phone number</label>
              <div className="auth-phone-field">
                <select value={form.country} onChange={(event) => updateCountry(event.target.value)} aria-label="Country and phone code" required>
                  <option value="">Country code</option>
                  {countries.map((country) => (
                    <option key={`${country.name}-${country.code}`} value={country.name}>
                      {getCountryShortName(country.name)} {country.code}
                    </option>
                  ))}
                </select>
                <input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} type="tel" placeholder="1711-234567" required />
              </div>
            </div>
            <div className="auth-options-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(event) => updateForm('termsAccepted', event.target.checked)}
                  required
                />
                <span>I accept the terms</span>
              </label>
            </div>
            <button className={signupMutation.isPending ? 'auth-submit auth-submit--loading' : 'auth-submit'} type="submit" disabled={signupMutation.isPending}>
              {signupMutation.isPending ? 'Creating account...' : 'Create company account'}
            </button>
            <div className="auth-center-copy">Already have an account? <Link to="/login">Sign in</Link></div>
          </form>
        </div>
        <AuthBrand message="Start with your company workspace, then invite the team that manages every drawing, submittal, and approval." />
      </div>
      {showReference ? (
        <FormStateCards
          submitText="Create company account"
          loadingText="Creating account..."
          successText="Company account created. Redirecting you to sign in..."
          errorLabel="Admin work email"
          errorText="A company account already exists for this email."
        />
      ) : null}
    </>
  );
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const response = error.data as { error?: { message?: string | string[] } } | null;
    const message = response?.error?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return message ?? error.message;
  }

  return error instanceof Error ? error.message : '';
}

function LoginScreen({ showReference = false }: { showReference?: boolean }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      persistUser(response.data.user);
      toast.success(response.message || 'Login successful');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate(form);
  };

  return (
    <>
      <div className="auth-card auth-card--compact">
        <div className="auth-form-panel auth-form-panel--center">
          <p className="auth-eyebrow">Sign In</p>
          <h1>Welcome back</h1>
          <p className="auth-intro">Sign in to manage drawings, submittals, and approvals across your projects.</p>
          <form className="auth-form-stack" onSubmit={handleSubmit}>
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              placeholder="you@company.com"
              required
            />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder="Enter your password"
              required
            />
            <RememberRow />
            <button className={loginMutation.isPending ? 'auth-submit auth-submit--loading' : 'auth-submit'} type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
            <div className="auth-center-copy">Don't have a company account? <Link to="/company-signup">Create one</Link></div>
          </form>
        </div>
        <AuthBrand message="Every drawing, submittal, and approval tracked, versioned, and auditable in one workspace." />
      </div>
      {showReference ? (
        <FormStateCards
          submitText="Sign in"
          loadingText="Signing in..."
          successText="Signed in. Redirecting to your dashboard..."
          errorLabel="Password"
          errorText="Incorrect email or password for this workspace."
        />
      ) : null}
    </>
  );
}

function SetPasswordScreen({ showReference = false }: { showReference?: boolean }) {
  return (
    <>
      <div className="auth-card auth-card--tall">
        <div className="auth-form-panel auth-form-panel--center">
          <p className="auth-eyebrow">Activate Account</p>
          <h1>Set your password</h1>
          <div className="auth-note">You've been invited to join <strong>Tech Marine Solutions Ltd</strong> on Project Portal.</div>
          <div className="auth-form-stack">
            <Field label="Email" defaultValue="sarah.lee@techmarine.com" readOnly />
            <Field label="New password" type="password" defaultValue="OceanRig!47x" />
            <Field label="Confirm new password" type="password" defaultValue="OceanRig!47x" />
            <div>
              <div className="auth-strength">
                <span />
                <span />
                <span />
                <span />
              </div>
              <span className="auth-helper">Strong password.</span>
            </div>
            <button className="auth-submit" type="button">Set password and continue</button>
          </div>
        </div>
        <AuthBrand tenant message="Set your password to activate your Project Portal account for Tech Marine Solutions Ltd." />
      </div>
      {showReference ? (
        <FormStateCards
          submitText="Set password and continue"
          loadingText="Setting password..."
          successText="Password set. Redirecting you to sign in..."
          errorLabel="Confirm new password"
          errorText="Passwords do not match."
        />
      ) : null}
    </>
  );
}

function RememberRow() {
  return (
    <div className="auth-options-row">
      <label>
        <input type="checkbox" />
        <span>Remember me</span>
      </label>
      <Link to="/set-password">Forgot password?</Link>
    </div>
  );
}

export function AuthPage({ screen }: AuthPageProps) {
  const [dark, setDark] = useState(false);
  usePageTitle(screen === 'all' ? 'Auth screens' : 'Login');

  const screens = screen === 'all' ? ['company-signup', 'login', 'set-password'] : [screen];
  const pageClassName = [
    'auth-reference',
    dark && 'auth-reference--dark',
    screen !== 'all' && 'auth-reference--single',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={pageClassName}>
      {screen === 'all' ? (
        <div className="auth-theme-toggle">
          <span>{dark ? 'Dark' : 'Light'}</span>
          <button
            className={dark ? 'auth-switch auth-switch--active' : 'auth-switch'}
            type="button"
            aria-label="Toggle dark mode"
            onClick={() => setDark((current) => !current)}
          >
            <span />
          </button>
        </div>
      ) : null}
      {screen === 'all' ? (
        screens.map((item, index) => {
          if (item === 'company-signup') {
            return (
              <AuthFrame
                key={item}
                number="01"
                title="Company Sign-Up"
                description="Creates the company's System Admin account."
              >
                <CompanySignupScreen showReference />
              </AuthFrame>
            );
          }
          if (item === 'login') {
            return (
              <AuthFrame
                key={item}
                number="02"
                title="Sign In"
                description="For all users with an existing account."
              >
                <LoginScreen showReference />
              </AuthFrame>
            );
          }
          return (
            <AuthFrame
              key={item}
              number={String(index + 1).padStart(2, '0')}
              title="Set Password / First Login"
              description="Reached from the credential email sent when an admin creates a user."
            >
              <SetPasswordScreen showReference />
            </AuthFrame>
          );
        })
      ) : (
        <AuthContentFrame>
          {screen === 'company-signup' ? <CompanySignupScreen /> : null}
          {screen === 'login' ? <LoginScreen /> : null}
          {screen === 'set-password' ? <SetPasswordScreen /> : null}
        </AuthContentFrame>
      )}
    </main>
  );
}
