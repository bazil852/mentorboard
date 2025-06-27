import React, { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'

export const AuthPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="h-screen w-screen bg-black/5 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black/10 rounded-full mb-4 backdrop-blur-sm border border-black/10">
            <span className="text-2xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">The Mentor Board</h1>
          <p className="text-black/60">Your collaborative mentoring workspace</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-black/10 p-8">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#f8fafc',
                    defaultButtonBackgroundHover: '#f1f5f9',
                    defaultButtonBorder: '#e2e8f0',
                    defaultButtonText: '#374151',
                    dividerBackground: '#e5e7eb',
                    inputBackground: '#ffffff',
                    inputBorder: '#d1d5db',
                    inputBorderHover: '#9ca3af',
                    inputBorderFocus: '#3b82f6',
                    inputText: '#111827',
                    inputLabelText: '#374151',
                    inputPlaceholder: '#9ca3af',
                    messageText: '#374151',
                    messageTextDanger: '#dc2626',
                    anchorTextColor: '#3b82f6',
                    anchorTextHoverColor: '#2563eb',
                  },
                  space: {
                    inputPadding: '12px',
                    buttonPadding: '12px 24px',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    buttonBorderRadius: '8px',
                    inputBorderRadius: '8px',
                  },
                }
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
                label: 'auth-label',
                message: 'auth-message',
              }
            }}
            providers={['google', 'github']}
            redirectTo={`${window.location.origin}/dashboard`}
            onlyThirdPartyProviders={false}
            magicLink={true}
            theme="light"
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-black/50 text-sm">
          <p>Start collaborating with mentors and mentees today</p>
        </div>
      </div>
    </div>
  )
} 