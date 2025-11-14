import React from 'react';

export type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

const ExternalLink = React.forwardRef<HTMLAnchorElement, ExternalLinkProps>(
  ({ children, target = '_blank', rel = 'noopener noreferrer', ...rest }, ref) => (
    <a {...rest} target={target} rel={rel} ref={ref}>
      {children}
    </a>
  )
);

ExternalLink.displayName = 'ExternalLink';

export default ExternalLink;
