-- Mark catalogue packs applied. Run after every sql/003/p*.sql batch.
-- Idempotent. Does not replace existing providers.

update public.navigator_workspace
set
  payload = payload
    || jsonb_build_object(
      'appliedPacks', (
        select to_jsonb(array_agg(distinct x))
        from unnest(
          coalesce(
            array(select jsonb_array_elements_text(coalesce(payload->'appliedPacks', '[]'::jsonb))),
            array[]::text[]
          ) || array['nl-consumer-credit-2026-09-19-v1', 'mining-solutions-europe-2026-09-19-v1']
        ) as x
      )
    )
    || case
      when coalesce(payload->>'sourceNote', '') like '%merged 19 September 2026%'
        then '{}'::jsonb
      else jsonb_build_object(
        'sourceNote', coalesce(payload->>'sourceNote', '') || ' NL consumer-credit catalogue and Europe mining solutions merged 19 September 2026.'
      )
    end,
  updated_at = now()
where id = 'nl-de-nordics-2026-v1';

notify pgrst, 'reload schema';
