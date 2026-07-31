import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { Home } from './Home';
import { Category } from './Category';
import { Occasion } from './Occasion';
import { ConditionLanding } from './BackPainLanding';
import { TrainingLanding } from './TrainingLanding';
import { Account } from './Account';
import { Feedback } from './Feedback';
import { Help } from './Help';
import { Terms } from './Terms';
import { BookingFlow } from './book/BookingFlow';

export function SiteApp() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/physiotherapy" element={<Category service="physiotherapy" />} />
        <Route path="/physical-training" element={<Category service="training" />} />
        <Route path="/physiotherapy/:condition" element={<ConditionLanding />} />
        <Route path="/physical-training/:goal" element={<TrainingLanding />} />
        <Route path="/:category/:condition" element={<Occasion />} />
        <Route path="/account" element={<Account />} />
        <Route path="/help" element={<Help />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/feedback/:token" element={<Feedback />} />
      </Route>
      <Route path="/book" element={<BookingFlow />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
