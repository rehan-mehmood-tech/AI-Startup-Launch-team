'use client'

import { Mail } from 'lucide-react'
import { GithubIcon, LinkedinIcon, XIcon } from '@/components/ui/brand-icons'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Anchors resolve to real targets: #features / #agents are ids on landing
// sections, Pricing and FAQ are their own routes. Documentation and Privacy
// Policy have no page yet.
const footerLinks = [
  { title: 'Validation Engine', href: '/#features' },
  { title: 'AI Agents', href: '/#agents' },
  { title: 'Pricing', href: '/pricing' },
  { title: 'FAQ', href: '/faq' },
  { title: 'Documentation', href: '#docs' },
  { title: 'Privacy Policy', href: '#privacy' },
]

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-zinc-800 bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-x-8 gap-y-10 sm:flex-row">
          <div className="space-y-4 max-w-md">
            <Logo size={28} textClassName="text-lg" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              Validate your startup idea, test market demand, and assemble your autonomous AI execution team in under two
              minutes.
            </p>
            <ul className="flex flex-wrap items-center gap-4 text-sm">
              {footerLinks.map(({ title, href }) => (
                <li key={title}>
                  <Link href={href} className="text-zinc-400 hover:text-amber-300 transition-colors">
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <h6 className="font-semibold text-white">Stay up to date</h6>
            <p className="text-xs text-zinc-400">Get early access to new AI agents &amp; venture market insights.</p>
            {/* Not wired to any mailing-list backend yet — submit is a no-op. */}
            <form onSubmit={e => e.preventDefault()} className="flex items-center gap-2">
              <Input
                placeholder="Enter your email"
                type="email"
                aria-label="Email address"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
              />
              <Button type="submit" className="bg-amber-400 hover:bg-amber-500 text-black font-medium">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-zinc-900 flex flex-col-reverse items-center justify-between gap-y-4 sm:flex-row text-xs text-zinc-500">
          <span>&copy; {new Date().getFullYear()} AI Startup Launch Team. All rights reserved.</span>

          <div className="flex items-center gap-5">
            <Link
              href="https://github.com/rehan-mehmood-tech/AI-Startup-Launch-team"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="hover:text-amber-400"
            >
              <GithubIcon className="h-4 w-4" />
            </Link>
            <Link href="#" aria-label="X (Twitter)" className="hover:text-amber-400">
              <XIcon className="h-4 w-4" />
            </Link>
            <Link href="#" aria-label="LinkedIn" className="hover:text-amber-400">
              <LinkedinIcon className="h-4 w-4" />
            </Link>
            <Link href="#" aria-label="Email" className="hover:text-amber-400">
              <Mail className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
