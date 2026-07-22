import { PageShell } from '@/components/page-shell';
import { ProjectCard } from '@/components/project-card';
import { SectionHeader } from '@/components/section-header';
import { authors, projects } from '@/lib/fixtures';

/** A live-feeling slice of the feed — the real thing swaps in once M3+ ships. */
export function FeedPreview() {
  return (
    <section id="feed" className="scroll-mt-20">
      <PageShell className="py-16 sm:py-20">
        <SectionHeader
          kicker="fresh from the workbench"
          title="what's shipping right now"
          note="a slice of the discovery feed — four projects, four different kinds of proud."
          className="mb-8"
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.slug}
              project={project}
              author={authors[project.author]}
              staggerIndex={i}
            />
          ))}
        </div>
      </PageShell>
    </section>
  );
}
