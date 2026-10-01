import type {Metadata} from 'next';
import {Suspense} from 'react';
import {AppProvider} from '@/hooks/use-app';
import {Shell} from '@/components/app-shell';
import './globals.css';
export const metadata:Metadata={title:'30 MINUTE — 30 Minutes to Understand. 5 Minutes to Pitch.',description:'One unfamiliar subject. Thirty minutes to research. Five minutes to explain. A focused learning and content-creation workspace with 100+ real challenges.',icons:{icon:'/favicon.svg'},other:{'theme-color':'#0b0e0e'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Suspense fallback={<div className="loading">30 MINUTE</div>}><AppProvider><Shell>{children}</Shell></AppProvider></Suspense></body></html>;}
