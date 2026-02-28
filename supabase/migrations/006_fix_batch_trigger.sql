-- Fix: Use separate trigger functions per table (NEW record has different columns)
DROP TRIGGER IF EXISTS trg_check_batch_stock_gate_out ON gate_out_logs;
DROP TRIGGER IF EXISTS trg_check_batch_stock_transfer ON transfer_logs;

CREATE OR REPLACE FUNCTION trg_check_batch_stock_gate_out()
RETURNS TRIGGER AS $$
DECLARE
  v_available NUMERIC;
BEGIN
  v_available := get_batch_available_weight(NEW.perfume_id, NEW.main_location_id, NEW.sub_location_id, NEW.batch_number);
  IF TG_OP = 'UPDATE' THEN
    v_available := v_available + OLD.net_weight;
  END IF;
  IF v_available < NEW.net_weight THEN
    RAISE EXCEPTION 'Insufficient batch stock: available %.3f, requested %.3f', v_available, NEW.net_weight;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_check_batch_stock_transfer()
RETURNS TRIGGER AS $$
DECLARE
  v_available NUMERIC;
BEGIN
  v_available := get_batch_available_weight(NEW.perfume_id, NEW.from_main_location_id, NEW.from_sub_location_id, NEW.batch_number);
  IF TG_OP = 'UPDATE' THEN
    v_available := v_available + OLD.net_weight;
  END IF;
  IF v_available < NEW.net_weight THEN
    RAISE EXCEPTION 'Insufficient batch stock: available %.3f, requested %.3f', v_available, NEW.net_weight;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_batch_stock_gate_out
  BEFORE INSERT OR UPDATE OF net_weight, perfume_id, main_location_id, sub_location_id, batch_number
  ON gate_out_logs
  FOR EACH ROW EXECUTE FUNCTION trg_check_batch_stock_gate_out();

CREATE TRIGGER trg_check_batch_stock_transfer
  BEFORE INSERT OR UPDATE OF net_weight, perfume_id, from_main_location_id, from_sub_location_id, batch_number
  ON transfer_logs
  FOR EACH ROW EXECUTE FUNCTION trg_check_batch_stock_transfer();
