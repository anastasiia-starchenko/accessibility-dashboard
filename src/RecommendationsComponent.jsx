const RecommendationsComponent = ({ data }) => (
    <div>
        <h2>Recommendations</h2>
        {data.map((issue) => (
            <div key={issue.id}>
                <h3>{issue.id}</h3>
                <p>{issue.help}</p>
            </div>
        ))}
    </div>
);

export default RecommendationsComponent;
