import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { ChevronsDown } from "lucide-react";

interface FAQProps {
  q: string;
  a: string;
}

const QA = ({ q, a }: FAQProps) => (
  <Accordion sx={{ py: 1 }}>
    <AccordionSummary expandIcon={<ChevronsDown />}>
      <Typography variant="h4" fontWeight="bold">
        {q}
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Typography>{a}</Typography>
    </AccordionDetails>
  </Accordion>
);

export const FAQ = () => {
  return (
    <Container maxWidth="lg">
      <Typography
        variant="h1"
        fontWeight="bold"
        color="primary"
        align="center"
        marginY={8}
      >
        Frequently Asked Questions
      </Typography>

      <QA
        q="Do we really need another job board?"
        a="We think so! Traditional job boards prioritize employers' needs over a seamless experience for job seekers. This is why so many of them end up with cluttered interfaces and generic search functions. Better Job Board is different: we put the job seeker front and center. This focus leads to a streamlined, user-first experience with powerful, intuitive search and filtering tools. We're here to make finding the right job faster, simpler, and a whole lot better."
      />
      <QA
        q="Where do you find all these jobs?"
        a="We pull job posts directly from known employers, accessing their applicant tracking systems (ATS) through official APIs. This way, we ensure high-quality, up-to-date posts while our smart search surfaces the most relevant opportunities for you."
      />
      <QA
        q="How fresh are these job posts?"
        a="We refresh our job posts daily to ensure you're seeing the latest opportunities. With that level of freshness, you can apply while they're still hot!"
      />
      <QA
        q="I found a great job! How do I apply?"
        a="When you find a job you're interested in, just click &quot;Apply&quot; and we'll direct you to the employer's official application page. We never stand between you and the employer – you'll always apply directly through their preferred channel."
      />
      <QA
        q="Can I save jobs for later?"
        a='To save a job for later, click "Apply" to open the employer&apos;s official application page, then bookmark it in your browser.'
      />
      <QA
        q="Can I save my search and come back later?"
        a="When you update your search criteria, the URL in your browser's address bar will update automatically. You can bookmark this URL to save your search and return to it later. Using the bookmark will restore your search criteria and re-run the search."
      />
      <QA
        q="How do I know these jobs are still up for grabs?"
        a="We update our job posts every day and remove any that are no longer accepting applications. If you see it here, it was verified as active within the last 24 hours! If you do find a job that has been taken down since our last update, the apply link won't work."
      />
      <QA
        q="What data do you collect about me?"
        a="We're committed to privacy-first job search. We don't require an account and don't track individual users. We do log IP addresses and general search patterns to improve our site and prevent misuse, but this data isn't linked to personal identities."
      />
      <QA
        q="I'm hiring! Can I post my job here?"
        a="We don't accept direct job submissions, but we regularly index job posts from employers who use supported applicant tracking systems. The best way to ensure your job appears on our platform is to post it on your company's careers page."
      />
      <QA
        q="Got an idea to make this better?"
        a="We'd love to hear it! Send your thoughts to [PLACEHOLDER]. We read every message and use your feedback to shape our improvements. While we can't reply to every message personally, your input goes a long way in helping us build a better experience for all job seekers."
      />
    </Container>
  );
};
