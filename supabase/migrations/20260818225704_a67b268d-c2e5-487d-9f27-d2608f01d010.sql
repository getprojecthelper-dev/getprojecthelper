insert into credit_transactions (user_id, delta, kind, reason)
values ('cba6e696-3adc-475e-b95b-c9c6f4eb3582', 300, 'admin_adjust', 'Owner top-up');

update credit_balances
set balance = balance + 300,
    lifetime_granted = lifetime_granted + 300
where user_id = 'cba6e696-3adc-475e-b95b-c9c6f4eb3582';