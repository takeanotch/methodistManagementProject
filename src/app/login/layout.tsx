


import '../globals.css'
import { Toaster } from 'react-hot-toast'


export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
    
    {children}
    <Toaster position="top-right" />
    </>
        
   
  )
}