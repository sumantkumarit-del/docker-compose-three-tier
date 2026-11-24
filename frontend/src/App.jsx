import { useCallback, useEffect, useState } from 'react';

const emptyForm = { name: '', email: '', department: '' };

async function readResponse(response) {
  const body = await response.text();
  let data;

  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    data = body;
  }

  if (!response.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

function App() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readResponse(await fetch('/api/employees'));
      setEmployees(data);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function addEmployee(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const employee = await readResponse(
        await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }),
      );
      setEmployees((current) => [...current, employee]);
      setForm(emptyForm);
      setMessage(`Employee ${employee.name} was added successfully.`);
    } catch (requestError) {
      setError(requestError.message || 'Unable to add employee.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="PeopleDesk home">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>PeopleDesk</span>
        </a>
        <span className="topbar-label">PEOPLE OPERATIONS</span>
      </header>

      <section className="intro">
        <p className="eyebrow">EMPLOYEE DIRECTORY</p>
        <h1>People make the work.</h1>
        <p className="intro-copy">
          Keep your team details organized in one simple place.
        </p>
      </section>

      <section className="content-grid" aria-label="Employee management">
        <div className="panel directory-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR TEAM</p>
              <h2>Employees</h2>
            </div>
            <span className="count-badge">{employees.length}</span>
          </div>

          {error && (
            <div className="notice error-notice" role="alert">
              <strong>Something went wrong</strong>
              <span>{error}</span>
              <button className="text-button" type="button" onClick={loadEmployees}>
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <p className="state-message" role="status">Loading employees…</p>
          ) : employees.length === 0 && !error ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">✳</span>
              <h3>No employees yet</h3>
              <p>Add your first teammate with the form.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">NAME</th>
                    <th scope="col">EMAIL</th>
                    <th scope="col">DEPARTMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="id-cell">#{employee.id}</td>
                      <td>
                        <span className="person-cell">
                          <span className="avatar" aria-hidden="true">
                            {employee.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                          <span>{employee.name}</span>
                        </span>
                      </td>
                      <td className="muted-cell">{employee.email}</td>
                      <td><span className="department-tag">{employee.department}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel form-panel">
          <p className="eyebrow">GROW YOUR TEAM</p>
          <h2>Add an employee</h2>
          <p className="form-description">
            Enter the details below to add someone to your directory.
          </p>

          {message && <div className="notice success-notice" role="status">{message}</div>}

          <form onSubmit={addEmployee}>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Alex Morgan"
              value={form.name}
              onChange={updateField}
              autoComplete="name"
              required
            />

            <label htmlFor="email">Work email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="alex@company.com"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
            />

            <label htmlFor="department">Department</label>
            <input
              id="department"
              name="department"
              type="text"
              placeholder="e.g. Engineering"
              value={form.department}
              onChange={updateField}
              required
            />

            <button className="submit-button" type="submit" disabled={submitting}>
              {submitting ? 'Adding employee…' : 'Add employee'}
              {!submitting && <span aria-hidden="true">→</span>}
            </button>
          </form>
          <p className="form-footnote">All fields are required.</p>
        </aside>
      </section>

      <footer className="footer">
        <span>PeopleDesk</span>
        <span>Employee information, made simple.</span>
      </footer>
    </main>
  );
}

export default App;
