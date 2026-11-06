-- Banco do portal Cristhaal. Rodar uma vez no Supabase: SQL Editor > New query > colar > Run.
-- Pode rodar de novo sem problema: nada é apagado.

-- Publicações -----------------------------------------------------------------------------------
create table if not exists public.posts (
  id          text primary key,
  frente      text not null check (frente in ('educa', 'experimenta', 'inspira', 'geral')),
  areas       text[] not null default '{}',
  autor       text not null default 'equipe' check (autor in ('equipe', 'coord')),
  data        date not null default current_date,
  -- Quantos espaços de foto mostrar quando a publicação ainda não tem fotos reais (posts de exemplo).
  fotos       int not null default 0,
  seed        int not null default 0,
  titulo      text not null check (length(titulo) between 1 and 300),
  titulo_al   text check (titulo_al in ('left', 'center', 'right')),
  titulo_w    int check (titulo_w between 25 and 100),
  resumo      text not null default '',
  -- Blocos do texto: [{ "p": "..." }, { "h": "..." }, { "ul": [...] }, { "img": "url", "leg": "..." }, { "steps": true }]
  corpo       jsonb not null default '[]',
  -- Fotos da capa e da galeria (URLs do Storage). A primeira é a capa.
  imagens     text[] not null default '{}',
  criado_por  uuid default auth.uid() references auth.users on delete set null,
  criado_em   timestamptz not null default now()
);

create index if not exists posts_data_idx on public.posts (data desc, criado_em desc);

alter table public.posts enable row level security;

-- Qualquer pessoa lê. Só quem entrou com uma conta da equipe escreve.
-- Os cadastros pelo site ficam desligados (Authentication > Sign In / Providers > "Allow new users to sign up"),
-- então só existe conta para quem o administrador criar em Authentication > Users.
drop policy if exists "posts: leitura pública" on public.posts;
create policy "posts: leitura pública" on public.posts for select using (true);

drop policy if exists "posts: equipe cria" on public.posts;
create policy "posts: equipe cria" on public.posts for insert to authenticated with check (true);

drop policy if exists "posts: equipe edita" on public.posts;
create policy "posts: equipe edita" on public.posts for update to authenticated using (true) with check (true);

drop policy if exists "posts: equipe apaga" on public.posts;
create policy "posts: equipe apaga" on public.posts for delete to authenticated using (true);

-- Fotos ----------------------------------------------------------------------------------------
-- Bucket público (qualquer um vê as fotos), até 10 MB por arquivo, só imagens.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos: equipe envia" on storage.objects;
create policy "fotos: equipe envia" on storage.objects for insert to authenticated with check (bucket_id = 'fotos');

drop policy if exists "fotos: equipe apaga" on storage.objects;
create policy "fotos: equipe apaga" on storage.objects for delete to authenticated using (bucket_id = 'fotos');

drop policy if exists "fotos: equipe lista" on storage.objects;
create policy "fotos: equipe lista" on storage.objects for select to authenticated using (bucket_id = 'fotos');
