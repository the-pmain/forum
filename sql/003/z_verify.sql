select
  jsonb_array_length(payload->'providers') as providers,
  (
    select count(*) from jsonb_array_elements(payload->'providers') p
    where p->>'origin' = 'nl-consumer-credit/1.0'
  ) as nl_credit,
  (
    select count(*) from jsonb_array_elements(payload->'providers') p
    where p->>'origin' = 'mining-solutions-europe/1.0'
  ) as mining,
  (
    select count(*) from jsonb_array_elements(payload->'providers') p
    where p->>'publicationStatus' = 'review_hold'
  ) as review_hold,
  (
    select count(*) from jsonb_array_elements(payload->'providers') p
    where p->>'publicationStatus' = 'legacy'
  ) as legacy,
  payload->'appliedPacks' as packs
from public.navigator_workspace
where id = 'nl-de-nordics-2026-v1';
