import { forwardRef, type AnchorHTMLAttributes } from 'react'

interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: React.ReactNode
}

/**
 * External link component with security attributes.
 * Automatically adds rel="noopener noreferrer" and target="_blank".
 * 
 * @example
 * <ExternalLink href="https://example.com">Visit Example</ExternalLink>
 */
export const ExternalLink = forwardRef<HTMLAnchorElement, ExternalLinkProps>(
  ({ href, children, className, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...props}
      >
        {children}
      </a>
    )
  }
)

ExternalLink.displayName = 'ExternalLink'

export default ExternalLink
