import { cleanup,render,screen } from '@testing-library/react'
import { afterEach,beforeEach,describe,expect,it } from 'vitest'
import App from './App'
import { RouterProvider } from './router'
import { DataProvider } from './state/DataContext'

const renderRoute = (path: string) => { history.replaceState(null,'',path); return render(<RouterProvider><DataProvider><App/></DataProvider></RouterProvider>) }
describe('critical route rendering',()=>{
  beforeEach(()=>history.replaceState(null,'','/'))
  afterEach(()=>cleanup())
  it('renders the dashboard and all seven tool links',()=>{renderRoute('/');expect(screen.getByRole('heading',{name:'Plan clearly. Calculate confidently.'})).toBeInTheDocument();expect(screen.getAllByText(/Calculator|Planner|Reference|Scratchpad/).length).toBeGreaterThanOrEqual(7)})
  it('loads a direct calculator route with deterministic default output',()=>{renderRoute('/subnet');expect(screen.getByRole('heading',{name:'Subnet Calculator',level:1})).toBeInTheDocument();expect(screen.getByText('192.168.10.0')).toBeInTheDocument()})
  it('loads a direct settings route',()=>{renderRoute('/settings');expect(screen.getByRole('heading',{name:'Data & Settings'})).toBeInTheDocument();expect(screen.getByText('IndexedDB')).toBeInTheDocument()})
})
