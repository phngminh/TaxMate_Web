import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '../src/index.css'
import QttPage from '../src/pages/businessOwner/taxBook/qtt'

createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter>
  <nav className="flex flex-wrap gap-4 bg-amber-50 p-4 text-sm" aria-label="Tình huống dữ liệu mẫu">
    <strong>KIỂM TRA · DỮ LIỆU MẪU</strong>
    {['blocked', 'many-expenses', 'payable', 'overpaid', 'zero', 'locked', 'submitted', 'download-error', 'confirm-timeout', 'tkn'].map(scenario =>
      <a key={scenario} className="underline" href={`/tests/qtt-preview.html?year=2026&scenario=${scenario}${scenario === 'tkn' ? '&fromTkn=tkn-fixture' : ''}`}>{scenario}</a>)}
  </nav>
  <QttPage />
</BrowserRouter></React.StrictMode>)
