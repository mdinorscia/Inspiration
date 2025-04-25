import { useState } from 'react';

function Card({ children }) {
  return <div style={{ border: '1px solid #ccc', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>{children}</div>;
}
function CardContent({ children }) {
  return <div>{children}</div>;
}
function Button({ onClick, children }) {
  return <button onClick={onClick} style={{ padding: '8px 16px', background: '#333', color: '#fff', borderRadius: '6px' }}>{children}</button>;
}
function Input({ value, onChange, placeholder }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />;
}

export default function App() {
  const [compass, setCompass] = useState('');
  const [reflection, setReflection] = useState('');
  const [weeklyLog, setWeeklyLog] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  const handleSaveReflection = () => {
    if (reflection.trim()) {
      setWeeklyLog([...weeklyLog, reflection]);
      setReflection('');
      setShowSummary(true);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>🧭 Faith & Integrity Coach</h1>

      <Card>
        <CardContent>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Define Your Integrity Compass</h2>
          <Input
            placeholder="e.g., Faith, Responsibility, Honesty, Stewardship"
            value={compass}
            onChange={(e) => setCompass(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>📝 Daily Reflection</h2>
          <Input
            placeholder="Where will I lead with integrity today?"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
          <Button onClick={handleSaveReflection}>Save Reflection</Button>
        </CardContent>
      </Card>

      {showSummary && (
        <Card>
          <CardContent>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>📊 Weekly Summary</h2>
            <ul style={{ paddingLeft: '20px' }}>
              {weeklyLog.map((entry, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{entry}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
