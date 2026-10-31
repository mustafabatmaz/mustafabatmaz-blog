import { Link } from "@/i18n/navigation";

// A post's tags as mint pills, each opening the list of posts with that tag
export function PostTags({ tags }: { tags: readonly { name: string; slug: string }[] }) {
  if (tags.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag.slug}>
          <Link
            href={`/writing/tags/${tag.slug}`}
            className="rounded-full bg-mint px-3.5 py-1.5 font-mono text-xs text-mint-foreground no-underline"
          >
            {tag.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
