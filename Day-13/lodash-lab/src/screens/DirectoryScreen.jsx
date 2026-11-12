import { useMemo, useState } from 'react';
import sample from 'lodash/sample';
import shuffle from 'lodash/shuffle';
import map from 'lodash/map';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useDebouncedValue } from '../hooks/useDebounce';
import { COUNTRIES, DEPARTMENTS, SKILLS, fullName } from '../data/generateUsers';
import { COLUMNS, DEFAULT_FILTERS, clampPage, groupUsers, highlightParts, paginate, searchUsers, sortUsers, toggleSort } from '../lib/query';
import { formatMoney } from '../lib/stats';
import '../styles/directory.css';

const PAGE_SIZES = [10, 25, 50];
const GROUPS = [
  { id: '', label: 'None' },
  { id: 'department', label: 'Department' },
  { id: 'country', label: 'Country' },
  { id: 'role', label: 'Role' },
];
const COUNTRY_NAMES = Object.keys(COUNTRIES);
const ARIA_SORT = { asc: 'ascending', desc: 'descending' };

function Highlight({ text, query }) {
  return highlightParts(text, query).map((part, i) => (part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>));
}

export default function DirectoryScreen() {
  const { users, index, editUser } = useData();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [departments, setDepartments] = useState([]);
  const [country, setCountry] = useState('');
  const [skill, setSkill] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [ageMin, setAgeMin] = useState(DEFAULT_FILTERS.ageRange[0]);
  const [ageMax, setAgeMax] = useState(DEFAULT_FILTERS.ageRange[1]);
  const [sorts, setSorts] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [groupKey, setGroupKey] = useState('');
  const [pickedId, setPickedId] = useState(null);
  const [shuffled, setShuffled] = useState(null); // { base, users }: display-only reorder of one page

  const debouncedQuery = useDebouncedValue(query, 300);
  const typing = query !== debouncedQuery;

  const filters = useMemo(
    () => ({
      query: debouncedQuery,
      departments,
      countries: country ? [country] : [],
      skills: skill ? [skill] : [],
      minRating,
      ageRange: [Number(ageMin) || 0, Number(ageMax) || 0],
    }),
    [debouncedQuery, departments, country, skill, minRating, ageMin, ageMax]
  );

  // Back to page 1 whenever the filters, sort or page size change (adjusting state during render)
  const resetKey = JSON.stringify([filters, sorts, pageSize]);
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setPage(0);
    setShuffled(null);
  }

  const filtered = useMemo(() => searchUsers(index, filters), [index, filters]);
  const sorted = useMemo(() => sortUsers(filtered, sorts), [filtered, sorts]);
  const pages = useMemo(() => paginate(sorted, pageSize), [sorted, pageSize]);
  const groups = useMemo(() => (groupKey ? groupUsers(filtered, groupKey) : []), [filtered, groupKey]);

  const pageIndex = clampPage(page, pages.length);
  const pageUsers = pages[pageIndex] ?? [];
  const shown = shuffled && shuffled.base === pageUsers ? shuffled.users : pageUsers;

  const toggleDepartment = (name) => setDepartments((current) => (current.includes(name) ? current.filter((d) => d !== name) : [...current, name]));

  const resetFilters = () => {
    setQuery('');
    setDepartments([]);
    setCountry('');
    setSkill('');
    setMinRating(0);
    setAgeMin(DEFAULT_FILTERS.ageRange[0]);
    setAgeMax(DEFAULT_FILTERS.ageRange[1]);
    setPickedId(null);
  };

  const surpriseMe = () => {
    const user = sample(filtered);
    if (!user) {
      toast.info('No users to pick from. Loosen the filters first.');
      return;
    }
    setPickedId(user.id);
    setGroupKey('');
    const at = sorted.indexOf(user);
    if (at >= 0) setPage(Math.floor(at / pageSize));
    toast.info(`Surprise: ${fullName(user)}, ${user.role} in ${user.country}`);
  };

  const openGroup = (key) => {
    if (groupKey === 'department') setDepartments([key]);
    else if (groupKey === 'country') setCountry(key);
    else setQuery(key); // role has no filter of its own: search for it
    setGroupKey('');
  };

  const onSort = (event, id) => setSorts((current) => toggleSort(current, id, { additive: event.shiftKey }));

  const pageCount = pages.length;
  const filtersActive = Boolean(query || departments.length || country || skill || minRating || ageMin !== DEFAULT_FILTERS.ageRange[0] || ageMax !== DEFAULT_FILTERS.ageRange[1]);

  return (
    <div className="directory stack">
      <section className="card stack" aria-label="Search and filters">
        <div className="dir-toolbar">
          <label className="field dir-search">
            Search users
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email, city, skill..." />
          </label>
          <label className="field">
            Country
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">All countries</option>
              {COUNTRY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Skill
            <select value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">Any skill</option>
              {SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Minimum rating
            <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
              {[0, 2, 3, 4, 4.5].map((r) => (
                <option key={r} value={r}>
                  {r === 0 ? 'Any rating' : `${r} and up`}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="field dir-age">
            <legend>Age range</legend>
            <div className="row">
              <input type="number" aria-label="Minimum age" min="18" max="70" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
              <span aria-hidden="true">to</span>
              <input type="number" aria-label="Maximum age" min="18" max="70" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
            </div>
          </fieldset>
        </div>

        <fieldset className="dir-departments">
          <legend className="muted">Department</legend>
          <div className="row">
            {DEPARTMENTS.map((d) => (
              <label key={d} className="dir-check">
                <input type="checkbox" checked={departments.includes(d)} onChange={() => toggleDepartment(d)} />
                {d}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="row">
          <button type="button" className="btn btn-sm" onClick={resetFilters} disabled={!filtersActive}>
            Reset filters
          </button>
          <label className="row dir-inline">
            <span className="muted">Group by</span>
            <select value={groupKey} onChange={(e) => setGroupKey(e.target.value)}>
              {GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-sm" onClick={surpriseMe}>
            Random user
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setShuffled({ base: pageUsers, users: shuffle(pageUsers) })} disabled={groupKey !== '' || pageUsers.length < 2}>
            Shuffle page
          </button>
          <p className="dir-count" aria-live="polite">
            Showing {filtered.length.toLocaleString('en-US')} of {users.length.toLocaleString('en-US')} users
          </p>
          {typing && <span className="muted dir-hint">typing… filtering after you pause</span>}
        </div>
      </section>

      <section className="card stack" aria-label="Results">
        {filtered.length === 0 ? (
          <p className="dir-empty" role="status">
            No users match these filters. Try a different search or reset the filters.
          </p>
        ) : groupKey ? (
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="data">
              <caption className="sr-only">Users grouped by {groupKey}</caption>
              <thead>
                <tr>
                  <th scope="col">{GROUPS.find((g) => g.id === groupKey).label}</th>
                  <th scope="col" className="num">Users</th>
                  <th scope="col" className="num">Avg salary</th>
                  <th scope="col" className="num">Avg rating</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.key}>
                    <th scope="row">
                      <button type="button" className="dir-link" onClick={() => openGroup(g.key)} aria-label={`Filter to ${g.key}`}>
                        {g.key}
                      </button>
                    </th>
                    <td className="num">{g.count.toLocaleString('en-US')}</td>
                    <td className="num">{formatMoney(g.avgSalary)}</td>
                    <td className="num">{g.avgRating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
              <table className="data">
                <caption className="sr-only">Users. Click a column header to sort, hold Shift to sort by several columns.</caption>
                <thead>
                  <tr>
                    {COLUMNS.map((col) => {
                      const at = sorts.findIndex((s) => s.id === col.id);
                      const sort = sorts[at];
                      const numeric = ['age', 'salary', 'rating'].includes(col.id);
                      return (
                        <th key={col.id} scope="col" className={numeric ? 'num' : undefined} aria-sort={sort ? ARIA_SORT[sort.dir] : 'none'}>
                          <button type="button" className="dir-sort" onClick={(e) => onSort(e, col.id)}>
                            {col.label}
                            <span aria-hidden="true">{sort ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</span>
                            {sorts.length > 1 && sort && (
                              <span className="badge dir-order" title={`Sort priority ${at + 1}`}>
                                {at + 1}
                              </span>
                            )}
                          </button>
                        </th>
                      );
                    })}
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {map(shown, (u) => (
                    <tr key={u.id} className={u.id === pickedId ? 'is-picked' : undefined} aria-current={u.id === pickedId ? 'true' : undefined}>
                      <td>
                        <div className="dir-name">
                          <strong>
                            <Highlight text={fullName(u)} query={debouncedQuery} />
                          </strong>
                          <span className="muted">
                            <Highlight text={u.email} query={debouncedQuery} />
                          </span>
                        </div>
                      </td>
                      <td>{u.department}</td>
                      <td>{u.role}</td>
                      <td>{u.country}</td>
                      <td className="num">{u.age}</td>
                      <td className="num">{formatMoney(u.salary)}</td>
                      <td className="num">{u.rating.toFixed(1)}</td>
                      <td>{u.joinedAt}</td>
                      <td>
                        <button type="button" className="btn btn-sm" aria-label={`Edit ${fullName(u)}`} onClick={() => editUser(u.id)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="row dir-pager" aria-label="Pagination">
              <button type="button" className="btn btn-sm" onClick={() => setPage(clampPage(pageIndex - 1, pageCount))} disabled={pageIndex === 0}>
                Previous
              </button>
              <span aria-live="polite">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <button type="button" className="btn btn-sm" onClick={() => setPage(clampPage(pageIndex + 1, pageCount))} disabled={pageIndex >= pageCount - 1}>
                Next
              </button>
              <label className="row dir-inline">
                <span className="muted">Rows per page</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </nav>
          </>
        )}
      </section>
    </div>
  );
}
