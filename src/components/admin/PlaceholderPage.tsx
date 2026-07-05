interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className='p-8'>
      <h1 className='text-3xl font-semibold text-foreground'>{title}</h1>
      <p className='text-muted-foreground mt-2'>This page is under construction.</p>
    </div>
  )
}
